## 🧠 Brainstorm: Gemini Integration Improvements

### Context
We audited `app/actions/analyze.ts` and `backend/main.py`. The current implementation is robust ("SOTA 2026") but relies on "simulated" agentic behavior (pre-fetching data) and prompt-embedded system instructions. We can leverage native Gemini 1.5 features to make it faster, cheaper, and smarter.

---

### Option A: Native System Instructions & Schema
Move the massive "Judge" prompt from the user message into the dedicated `systemInstruction` field. Also, implement strict `responseSchema` instead of just `responseMimeType: "application/json"`.

✅ **Pros:**
- **Better Adherence:** System instructions are treated with higher priority for rule-following (e.g., "Zero Tolerance" output).
- **Cleaner Code:** Separates logic (the prompt) from data (the user input/context).
- **Type Safety:** Strict schema validation guarantees the JSON structure matches our TypeScript interfaces perfectly, removing the need for `JSON.parse` try/catch hacks.

❌ **Cons:**
- **Refactor Effort:** Requires changing how we instantiate and call the model in `lib/gemini.ts` and `analyze.ts`.
- **SDK Dependency:** Must ensure the current Vercel AI SDK or Google Gen AI SDK version fully supports strict schemas.

📊 **Effort:** Low

---

### Option B: True Agentic Function Calling
Replace the "Fan-Out" (parallel `Promise.all` of scouts) with Gemini Function Calling. Give Gemini tools like `findReviews(product)`, `searchYoutube(product)`, `getMarketData(product)`.

✅ **Pros:**
- **Smarter Execution:** Gemini only calls tools it *needs*. If it knows the product, it might skip a search. If data is ambiguous, it can ask for *more* searches.
- **Multi-Step Reasoning:** Can perform "Chain of Thought" data gathering (e.g., "Market data is vague, checking Reddit... Reddit is split, checking YouTube").
- **Cost Savings:** Avoids running all 3 scouts up-front if they aren't needed.

❌ **Cons:**
- **Latency:** Sequential tool calls (Model -> Tool -> Model -> Tool) are slower than our current parallel "Fan-Out".
- **Complexity:** Requires rewriting `analyze.ts` to handle the tool-use loop and state maintenance.

📊 **Effort:** High

---

### Option C: Multimodal Video Intelligence
Upgrade `video-scout` to use Gemini's native video understanding. Instead of just fetching transcripts (`backend/main.py`), pass video frames/thumbnails to Gemini to detect "clickbait faces," "broken products," or visual sentiment.

✅ **Pros:**
- **Deep Insight:** Can catch things text transcripts miss (e.g., reviewer looking disgusted, product breaking on camera).
- **Scam Detection:** Visually identify "fake" unboxing or dropshipping packaging.

❌ **Cons:**
- **Cost & Latency:** Processing video/images is significantly more expensive and slower than text-only analysis.
- **Data Volume:** Sending image frames for 5-10 videos per analysis might hit quota limits.

📊 **Effort:** Medium

---

### Option D: Native Google Search Grounding
Replace or augment our custom `marketScout` by enabling Gemini's native `googleSearch` tool.

✅ **Pros:**
- **Up-to-Date:** Access to live Google Search results without maintaining our own scraper/custom search logic.
- **Simplicity:** Removes the need for complex `marketScout` scraping logic for general web info.
- **Citations:** Native grounding provides source citations automatically.

❌ **Cons:**
- **Control:** We lose some control over *exactly* which sites are scraped (our `marketScout` targets specific trusted vendors).
- **Integration:** Requires using the Google Search tool configuration in the API call.

📊 **Effort:** Low

---

## 💡 Recommendation

**Option A (System Instructions & Schema)** is the immediate "low hanging fruit" that solidifies robustness.

However, **Option B (Function Calling)** is the true "Agentic" upgrade that fits the "Skeptek" ethos of a forensic investigator.

**I recommend starting with Option A** to clean up the architecture, then considering Option B for a specialized "Deep Dive" mode.

What direction would you like to explore?
