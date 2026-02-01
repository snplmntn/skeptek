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

# configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scraper")

app = Flask(__name__)

def get_driver():
    """setup headless chrome driver"""
    chrome_options = Options()
    chrome_options.add_argument("--headless") 
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    # auto-install/update driver
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
        
    # attempt 1: standard youtube_transcript_api (fastest)
    try:
        # subprocess isolation to bypass import corruption
        logger.info(f"fetching transcript for {video_id} via subprocess...")
        
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
                 pass # fallback to yt-dlp below

        logger.warning(f"primary transcript method failed: {stderr[:200]}")

    except Exception as e:
        logger.error(f"primary method exception: {e}")

    # attempt 2: yt-dlp fallback (robust against ip blocks)
    try:
        logger.info(f"attempting yt-dlp fallback for {video_id}...")
        transcript = fetch_transcript_ytdlp(video_id)
        if transcript:
             logger.info(f"yt-dlp fallback success for {video_id}")
             return jsonify({"video_id": video_id, "transcript": transcript})
    except Exception as e:
        logger.error(f"yt-dlp fallback failed: {e}")

    return jsonify({"error": "All transcript methods failed.", "details": "IP Blocked"}), 404

def fetch_transcript_ytdlp(video_id):
    """
    fallback using yt-dlp to extract automatic captions
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
            
            # 1. check automatic captions (most common)
            captions = info.get('automatic_captions', {}).get('en', [])
            # 2. check manual subtitles
            if not captions:
                captions = info.get('subtitles', {}).get('en', [])
            
            if not captions:
                return None
                
            # prefer json3 format for easy parsing
            json3_cap = next((c for c in captions if c.get('ext') == 'json3'), None)
            
            if json3_cap:
                res = requests.get(json3_cap['url'])
                if res.ok:
                    data = res.json()
                    transcript = []
                    # parse json3 events
                    # format: { events: [ { tStartMs: 123, dDurationMs: 456, segs: [{utf8: "text"}] } ] }
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
    verifies if a link is alive using selenium.
    bypasses cloudflare 403s that block simple fetch/head requests.
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
            # if we get here without exception, dns/connection is ok.
            
            # check title for "access denied" or "404"
            title = driver.title.lower()
            if "404" in title or "page not found" in title:
                logger.info(f"link invalid (404 title): {url}")
                return jsonify({"valid": False, "reason": "404 Title"})
            
            # redirect & nsfw detection
            current_url = driver.current_url.lower()
            if "reddit.com" in url.lower() and "reddit.com" not in current_url:
                 # redirected away from reddit (e.g. to spam site)
                 return jsonify({"valid": False, "reason": "Redirected outside domain"})

            # check for nsfw gates
            body = driver.find_element(By.TAG_NAME, "body").text.strip().lower()
            nsfw_triggers = ["over 18", "adult content", "nsfw", "click to enter", "mature content"]
            if any(trigger in body for trigger in nsfw_triggers):
                return jsonify({"valid": False, "reason": "NSFW/Restricted Content"})

            if not body:
                return jsonify({"valid": False, "reason": "Empty Body"})
                
            return jsonify({"valid": True})

        except Exception as nav_err:
            logger.warning(f"navigation error for {url}: {nav_err}")
            return jsonify({"valid": False, "reason": str(nav_err)})
            
    except Exception as e:
        logger.error(f"verification driver error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if driver:
            driver.quit()

@app.route("/scrape", methods=['GET'])
def scrape_url():
    """
    scrapes a dynamic spa/javascript-heavy website using selenium.
    """
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "Missing URL parameter"}), 400

    logger.info(f"start scraping: {url}")
    driver = None
    try:
        driver = get_driver()
        driver.set_page_load_timeout(30)
        
        driver.get(url)
        
        # anti-bot detection (amazon/lazada)
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
            logger.warning(f"bot detection triggered! title: {page_title} | body match: true")
            return jsonify({
                "error": "Bot Detection Triggered", 
                "block_type": "captcha",
                "title": page_title
            }), 403

        # specialized waiting strategy
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # auto-scroll to trigger lazy loading (reviews/price)
            total_height = int(driver.execute_script("return document.body.scrollHeight"))
            for i in range(1, total_height, 700):
                driver.execute_script(f"window.scrollTo(0, {i});")
                time.sleep(0.1)
            
            # final wait for settlement
            time.sleep(2.5) 

            # deep price extraction
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
                logger.info(f"found potential prices: {found_prices[:3]}")
            
        except Exception as e:
             logger.warning(f"wait/scroll timeout, continuing: {e}")

        content = driver.page_source
        
        # cleanup html with bs4
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
        logger.error(f"scrape failed: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if driver:
            driver.quit()

@app.route("/tools/market_deep_dive", methods=['POST'])
def market_tool():
    """
    agentic tool endpoint: returns detailed market data for a specific url.
    this is favored by the "brain" when it needs deep verification.
    """
    data = request.json
    url = data.get('url') if data else None
    
    if not url:
        return jsonify({"error": "Missing URL"}), 400

    driver = None
    try:
        driver = get_driver()
        driver.set_page_load_timeout(30)
        driver.get(url)
        
        # fast price & title check
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
                "is_available": True # mock availability for now
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
    agentic tool endpoint: downloads youtube video, extracts frames, and uses gemini vision to find visual defects.
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
        logger.warning("warning: opencv (cv2) not found. vision features disabled.")
    import os
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold

    # configure gemini inside the tool (using env var passed to backend or hardcoded for hackathon)
    # ideally this should be initialized globally
    api_key = os.environ.get("GOOGLE_API_KEY") 
    if api_key:
        genai.configure(api_key=api_key)
    
    try:
        # 1. download video (fastest format, worst quality sufficient for vision)
        logger.info(f"downloading video: {video_url}")
        
        ydl_opts = {
            'format': 'worst[ext=mp4]', # we just need visual context, not 4k
            'outtmpl': 'temp_video.%(ext)s',
            'quiet': True,
            'no_warnings': True
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([video_url])
            
        # 2. extract 3 key frames (beginning, middle, end)
        cap = cv2.VideoCapture("temp_video.mp4")
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = total_frames / fps
        
        frames = []
        # grab at 10%, 50%, 80% marks
        for percent in [0.1, 0.5, 0.8]:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(total_frames * percent))
            ret, frame = cap.read()
            if ret:
                # resize to save bandwidth (gemini only needs small imgs)
                frame = cv2.resize(frame, (640, 360)) 
                _, buffer = cv2.imencode('.jpg', frame)
                frames.append({
                    "mime_type": "image/jpeg",
                    "data": buffer.tobytes()
                })
        
        cap.release()
        
        # 3. analyze with gemini flash (fast vision)
        logger.info("sending frames to gemini vision...")
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
        
        # cleanup
        if os.path.exists("temp_video.mp4"):
            os.remove("temp_video.mp4")
            
        return jsonify({
            "tool_name": "video_insight",
            "status": "success",
            "data": json.loads(response.text)
        })

    except Exception as e:
        logger.error(f"video tool error: {e}")
        if os.path.exists("temp_video.mp4"):
            os.remove("temp_video.mp4")
        return jsonify({"error": str(e), "status": "failed"}), 500

@app.route("/tools/reddit_search", methods=['POST'])
def reddit_search_tool():
    """
    agentic tool: performs a "headless manual search" for reddit threads.
    this bypasses api limitations by acting as a human user.
    """
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "Missing query"}), 400

    logger.info(f"reddit manual search for: {query}")
    driver = None
    links = []
    
    try:
        driver = get_driver()
        # use duckduckgo to avoid google captchas in headless mode
        # "site:reddit.com" is key
        search_url = f"https://duckduckgo.com/?q=site%3Areddit.com+{query.replace(' ', '+')}&t=h_&ia=web"
        
        driver.get(search_url)
        time.sleep(2) # Wait for JS
        
        # extract results
        results = driver.find_elements(By.CSS_SELECTOR, "a[data-testid='result-title-a']")
        
        for res in results:
            url = res.get_attribute("href")
            title = res.text
            if url and "reddit.com/r/" in url and "/comments/" in url:
                links.append({"title": title, "url": url})
                
            if len(links) >= 5: break
            
        # fallback to google if ddg fails (rare)
        if not links:
             logger.info("ddg yielded no results. trying google fallback...")
             driver.get(f"https://www.google.com/search?q=site:reddit.com+{query.replace(' ', '+')}")
             time.sleep(2)
             g_results = driver.find_elements(By.TAG_NAME, "a")
             for res in g_results:
                 href = res.get_attribute("href")
                 if href and "reddit.com/r/" in href and "/comments/" in href:
                     # google redirect filtering often needed, but raw href works usually
                     links.append({"title": "Reddit Thread", "url": href})
                 if len(links) >= 5: break
        
        return jsonify({
            "tool_name": "reddit_search",
            "status": "success",
            "data": links
        })

    except Exception as e:
        logger.error(f"reddit search error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    # multi-threaded server by default in flask dev, or use gevent for prod
    print("🚀 skeptek backend starting... (endpoints: /scrape, /transcript, /verify, /tools/video_insight, /tools/reddit_search)")
    app.run(host="0.0.0.0", port=8000, threaded=True)
