from flask import Flask, request, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import logging
import subprocess
import sys
import json
import time

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scraper")

app = Flask(__name__)

def get_driver():
    """Setup Headless Chrome Driver"""
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    # Auto-install/update driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

@app.route("/")
def health_check():
    return jsonify({"status": "active", "service": "Skeptek Scraper (Flask+Selenium+Transcript)"})

@app.route("/transcript", methods=['GET'])
def get_transcript():
    video_id = request.args.get('video_id')
    if not video_id:
        return jsonify({"error": "Missing video_id"}), 400
        
    # Attempt 1: Standard youtube_transcript_api (Fastest)
    try:
        # SOTA 2026: Subprocess isolation to bypass import corruption
        logger.info(f"Fetching transcript for {video_id} via subprocess...")
        
        process = subprocess.Popen(
            [sys.executable, "-m", "youtube_transcript_api", video_id, "--format", "json"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, 
            text=True
        )
        stdout, stderr = process.communicate()
        
        if process.returncode == 0 and stdout:
             try:
                start_idx = stdout.find('[')
                end_idx = stdout.rfind(']')
                if start_idx != -1 and end_idx != -1:
                    clean_json = stdout[start_idx : end_idx + 1]
                    transcript = json.loads(clean_json)
                    return jsonify({"video_id": video_id, "transcript": transcript})
             except:
                 pass # Fallback to yt-dlp below

        logger.warning(f"Primary Transcript Method Failed: {stderr[:200]}")

    except Exception as e:
        logger.error(f"Primary Method Exception: {e}")

    # Attempt 2: yt-dlp Fallback (Robust against IP blocks)
    try:
        logger.info(f"Attempting yt-dlp fallback for {video_id}...")
        transcript = fetch_transcript_ytdlp(video_id)
        if transcript:
             logger.info(f"yt-dlp fallback success for {video_id}")
             return jsonify({"video_id": video_id, "transcript": transcript})
    except Exception as e:
        logger.error(f"yt-dlp fallback failed: {e}")

    return jsonify({"error": "All transcript methods failed.", "details": "IP Blocked"}), 404

def fetch_transcript_ytdlp(video_id):
    """
    Fallback using yt-dlp to extract automatic captions
    """
    import yt_dlp
    import requests
    
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en'],
        'quiet': True,
        'no_warnings': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # 1. Check Automatic Captions (Most common)
            captions = info.get('automatic_captions', {}).get('en', [])
            # 2. Check Manual Subtitles
            if not captions:
                captions = info.get('subtitles', {}).get('en', [])
            
            if not captions:
                return None
                
            # Prefer JSON3 format for easy parsing
            json3_cap = next((c for c in captions if c.get('ext') == 'json3'), None)
            
            if json3_cap:
                res = requests.get(json3_cap['url'])
                if res.ok:
                    data = res.json()
                    transcript = []
                    # Parse JSON3 events
                    # Format: { events: [ { tStartMs: 123, dDurationMs: 456, segs: [{utf8: "text"}] } ] }
                    if 'events' in data:
                        for event in data['events']:
                            if 'segs' in event and event['segs']:
                                text = " ".join([s.get('utf8', '') for s in event['segs']]).strip()
                                if text:
                                    transcript.append({
                                        'text': text,
                                        'start': event.get('tStartMs', 0) / 1000.0,
                                        'duration': event.get('dDurationMs', 0) / 1000.0
                                    })
                    return transcript
                    
            return None
            
    except Exception as e:
        logger.error(f"yt-dlp internal error: {e}")
        return None

@app.route("/verify", methods=['POST'])
def verify_link():
    """
    SOTA 2026: Verifies if a link is alive using Selenium.
    Bypasses Cloudflare 403s that block simple fetch/HEAD requests.
    """
    data = request.json
    url = data.get('url') if data else None
    
    if not url:
        return jsonify({"error": "Missing URL"}), 400

    driver = None
    try:
        driver = get_driver()
        driver.set_page_load_timeout(15) 
        
        try:
            driver.get(url)
            # If we get here without exception, DNS/Connection is OK.
            
            # Check Title for "Access Denied" or "404"
            title = driver.title.lower()
            if "404" in title or "page not found" in title:
                logger.info(f"Link Invalid (404 Title): {url}")
                return jsonify({"valid": False, "reason": "404 Title"})
            
            # SOTA 2026: Redirect & NSFW Detection
            current_url = driver.current_url.lower()
            if "reddit.com" in url.lower() and "reddit.com" not in current_url:
                 # Redirected away from Reddit (e.g. to spam site)
                 return jsonify({"valid": False, "reason": "Redirected outside domain"})

            # Check for NSFW Gates
            body = driver.find_element(By.TAG_NAME, "body").text.strip().lower()
            nsfw_triggers = ["over 18", "adult content", "nsfw", "click to enter", "mature content"]
            if any(trigger in body for trigger in nsfw_triggers):
                return jsonify({"valid": False, "reason": "NSFW/Restricted Content"})

            if not body:
                return jsonify({"valid": False, "reason": "Empty Body"})
                
            return jsonify({"valid": True})

        except Exception as nav_err:
            logger.warning(f"Navigation Error for {url}: {nav_err}")
            return jsonify({"valid": False, "reason": str(nav_err)})
            
    except Exception as e:
        logger.error(f"Verification Driver Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if driver:
            driver.quit()

@app.route("/scrape", methods=['GET'])
def scrape_url():
    """
    Scrapes a dynamic SPA/JavaScript-heavy website using Selenium.
    """
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "Missing URL parameter"}), 400

    logger.info(f"Start scraping: {url}")
    driver = None
    try:
        driver = get_driver()
        driver.set_page_load_timeout(30)
        
        driver.get(url)
        
        # SOTA 2026: Anti-Bot Detection (Amazon/Lazada)
        page_title = driver.title.lower()
        body_text = ""
        try:
            body_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        except:
            pass

        bot_triggers = ["robot check", "captcha", "access denied", "security challenge", "automated access"]
        amazon_triggers = ["continue shopping", "click the button below to continue shopping", "conditions of use"]
        
        if any(t in page_title for t in bot_triggers) or \
           (any(t in body_text for t in amazon_triggers) and len(body_text) < 1500):
            logger.warning(f"Bot Detection Triggered! Title: {page_title} | Body Match: True")
            return jsonify({
                "error": "Bot Detection Triggered", 
                "block_type": "captcha",
                "title": page_title
            }), 403

        # Specialized Waiting Strategy
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # SOTA 2026: Auto-Scroll to trigger Lazy Loading (Reviews/Price)
            total_height = int(driver.execute_script("return document.body.scrollHeight"))
            for i in range(1, total_height, 700):
                driver.execute_script(f"window.scrollTo(0, {i});")
                time.sleep(0.1)
            
            # Final wait for settlement
            time.sleep(2.5) 

            # Deep Price Extraction (SOTA 2026)
            price_selectors = [
                'span.a-price-whole', 'span.a-offscreen', '#corePrice_feature_div', 
                'div.price-box', '.product-price', '[data-test="product-price"]',
                '.shopeep-price', '.price-amount'
            ]
            found_prices = []
            for sel in price_selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, sel)
                    for el in elements:
                        txt = el.text or el.get_attribute("innerText")
                        if txt: found_prices.append(txt.strip())
                except: continue
            
            if found_prices:
                logger.info(f"Found potential prices: {found_prices[:3]}")
            
        except Exception as e:
             logger.warning(f"Wait/Scroll timeout, continuing: {e}")

        content = driver.page_source
        
        # Cleanup HTML with BS4
        soup = BeautifulSoup(content, "html.parser")
        for script in soup(["script", "style", "svg", "nav", "footer"]):
            script.decompose()
            
        clean_text = soup.body.get_text(separator="\n", strip=True) if soup.body else ""
        
        return jsonify({
            "url": url,
            "html": content, 
            "text": clean_text[:10000] 
        })

    except Exception as e:
        logger.error(f"Scrape Failed: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if driver:
            driver.quit()

@app.route("/tools/market_deep_dive", methods=['POST'])
def market_tool():
    """
    Agentic Tool Endpoint: Returns detailed market data for a specific URL.
    This is favored by the "Brain" when it needs deep verification.
    """
    data = request.json
    url = data.get('url') if data else None
    
    if not url:
        return jsonify({"error": "Missing URL"}), 400

    # Reuse the logic of scrape_url but structured for an Agent Tool Response
    # In a real microservice we would refactor the shared logic into a helper function.
    # For now, we call the scrape helper (simulated refactor) or just reuse the route.
    
    # We will invoke the existing scrape logic properly
    # Note: Flask 'test_request_context' is one way, but calling the function directly if logic was separated is better.
    # Since logic isn't separated, let's just create a new specialized lightweight scraper for the tool.
    
    driver = None
    try:
        driver = get_driver()
        driver.set_page_load_timeout(30)
        driver.get(url)
        
        # SOTA: Fast Price & Title Check
        title = driver.title
        price = "Unknown"
        
        price_selectors = ['.a-price-whole', '.a-offscreen', '.price-box', '.product-price']
        for sel in price_selectors:
            try:
                el = driver.find_element(By.CSS_SELECTOR, sel)
                if el.text: 
                    price = el.text
                    break
            except: continue
            
        return jsonify({
            "tool_name": "market_deep_dive",
            "status": "success",
            "data": {
                "title": title,
                "price": price,
                "url": url,
                "is_available": True # Mock availability for now
            }
        })
    except Exception as e:
        return jsonify({"error": str(e), "status": "failed"}), 500
    finally:
        if driver:
            driver.quit()

@app.route("/tools/video_insight", methods=['POST'])
def video_tool():
    """
    Agentic Tool Endpoint: Downloads YouTube video, extracts frames, and uses Gemini Vision to find visual defects.
    """
    data = request.json
    video_url = data.get('url') if data else None

    if not video_url:
        return jsonify({"error": "Missing URL"}), 400

    import yt_dlp
    try:
        import cv2
    except ImportError:
        cv2 = None
        print("Warning: OpenCV (cv2) not found. Vision features disabled.")
    import os
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold

    # Configure Gemini inside the tool (using Env var passed to backend or hardcoded for hackathon)
    # Ideally this should be initialized globally
    api_key = os.environ.get("GOOGLE_API_KEY") 
    if api_key:
        genai.configure(api_key=api_key)
    
    try:
        # 1. Download Video (Fastest format, worst quality sufficient for vision)
        logger.info(f"Downloading video: {video_url}")
        
        ydl_opts = {
            'format': 'worst[ext=mp4]', # We just need visual context, not 4K
            'outtmpl': 'temp_video.%(ext)s',
            'quiet': True,
            'no_warnings': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
            
        # 2. Extract 3 Key Frames (Beginning, Middle, End)
        cap = cv2.VideoCapture("temp_video.mp4")
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps
        
        frames = []
        # Grab at 10%, 50%, 80% marks
        for percent in [0.1, 0.5, 0.8]:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(total_frames * percent))
            ret, frame = cap.read()
            if ret:
                # Resize to save bandwidth (Gemini only needs small imgs)
                frame = cv2.resize(frame, (640, 360)) 
                _, buffer = cv2.imencode('.jpg', frame)
                frames.append({
                    "mime_type": "image/jpeg",
                    "data": buffer.tobytes()
                })
        
        cap.release()
        
        # 3. Analyze with Gemini Flash (Fast Vision)
        logger.info("Sending frames to Gemini Vision...")
        if not api_key:
             return jsonify({"status": "skipped", "reason": "No API Key configured on backend"}), 200

        model = genai.GenerativeModel('gemini-3-flash-preview')
        prompt = """
        Analyze these 3 frames from a product review video.
        1. Is the reviewer holding the product? (Yes/No)
        2. Does the product look broken, cheap, or fake?
        3. Is the reviewer making a disgusted or angry face?
        
        Return JSON Code Block:
        ```json
        { "reviewerHoldingProduct": boolean, "visualDefects": string, "angryFaceDetected": boolean }
        ```
        """
        
        response = model.generate_content(
            contents=[prompt, *frames],
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Cleanup
        if os.path.exists("temp_video.mp4"):
            os.remove("temp_video.mp4")
            
        return jsonify({
            "tool_name": "video_insight",
            "status": "success",
            "data": json.loads(response.text)
        })

    except Exception as e:
        logger.error(f"Video Tool Error: {e}")
        if os.path.exists("temp_video.mp4"):
            os.remove("temp_video.mp4")
        return jsonify({"error": str(e), "status": "failed"}), 500

@app.route("/tools/reddit_search", methods=['POST'])
def reddit_search_tool():
    """
    Agentic Tool: Performs a "Headless Manual Search" for Reddit threads.
    This bypasses API limitations by acting as a human user.
    """
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "Missing query"}), 400

    logger.info(f"Reddit Manual Search for: {query}")
    driver = None
    links = []
    
    try:
        driver = get_driver()
        # Use DuckDuckGo to avoid Google Captchas in Headless mode
        # "site:reddit.com" is key
        search_url = f"https://duckduckgo.com/?q=site%3Areddit.com+{query.replace(' ', '+')}&t=h_&ia=web"
        
        driver.get(search_url)
        time.sleep(2) # Wait for JS
        
        # Extract Results
        results = driver.find_elements(By.CSS_SELECTOR, "a[data-testid='result-title-a']")
        
        for res in results:
            url = res.get_attribute("href")
            title = res.text
            if url and "reddit.com/r/" in url and "/comments/" in url:
                links.append({"title": title, "url": url})
                
            if len(links) >= 5: break
            
        # Fallback to Google if DDG fails (rare)
        if not links:
             logger.info("DDG yielded no results. Trying Google Fallback...")
             driver.get(f"https://www.google.com/search?q=site:reddit.com+{query.replace(' ', '+')}")
             time.sleep(2)
             g_results = driver.find_elements(By.TAG_NAME, "a")
             for res in g_results:
                 href = res.get_attribute("href")
                 if href and "reddit.com/r/" in href and "/comments/" in href:
                     # Google redirect filtering often needed, but raw href works usually
                     links.append({"title": "Reddit Thread", "url": href})
                 if len(links) >= 5: break
        
        return jsonify({
            "tool_name": "reddit_search",
            "status": "success",
            "data": links
        })

    except Exception as e:
        logger.error(f"Reddit Search Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    # Multi-threaded server by default in Flask dev, or use gevent for prod
    print("🚀 Skeptek Backend Starting... (Endpoints: /scrape, /transcript, /verify, /tools/video_insight, /tools/reddit_search)")
    app.run(host="0.0.0.0", port=8000, threaded=True)
