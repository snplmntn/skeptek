<p align="center">
  <img src="./public/icon.png" width="120" height="120" alt="Skeptek Icon">
</p>

# Skeptek 👁️
**Product Analysis Engine** | *Built for the Gemini 3 Hackathon*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/snplmntns-projects/v0-skeptek)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203-4E8BF4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Status](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge)]()

> "The Minority Report for E-Commerce."

## 🚀 The Pitch
**Skeptek** is a "Precision Optics" engine designed to cut through the noise of the modern internet. In an era of AI-generated reviews, dropshipped white-label products, and inflated pricing, Skeptek acts as your trusted analyst.

It doesn't just "search" for a product. It **investigates** it. By deploying a swarm of specialized Gemini 3 agents, Skeptek triangulates data from official retailers, Reddit discussion threads, and YouTube video reviews to deliver a single, irrefutable **Truth Score**.

## 🧠 Powered by Gemini 3
Skeptek is built on a multi-agent architecture powered by the **Gemini 3.0 model family**. We leverage the massive context window and multimodal capabilities to perform deep analysis that was previously impossible.

### The Agent Swarm
1.  **🕵️ Market Scout (SOTA 2026 Grounding)**
    *   **Model**: `gemini-3.0-flash`
    *   **Role**: The first line of defense. It uses **Google Search Grounding** to traverse the live web, verifying product existence, **Original MSRP**, and **Competitor Pricing** to establish a baseline for value.
    *   **Chronological Awareness**: It now tracks **Release Dates** and **Successor Models** (e.g., M1 vs M4), ensuring you don't buy "new" tech that is actually 4 years old.
    *   **Python Muscle**: Connects to a dedicated **Python Microservice** for deep market verification when standard APIs fail.

2.  **🎥 Video Scout (Vision & Audio)**
    *   **Model**: `gemini-3.0-flash-preview`
    *   **Role**: A multimodal hunter that **watches and listens** to reviews.
    *   **Native Vision**: It downloads and "watches" product reviews using **Gemini Vision**, detecting physical defects (wobbly hinges, broken seals) and emotional cues (reviewer making a disgusted face).
    *   **Audio Forensics**: It deep-scans transcripts for "micro-complaints" buried in the audio track.

3.  **⚖️ The Judge (Reasoning Core)**
    *   **Model**: `gemini-3.0-flash`
    *   **Role**: The synthesis engine. It ingests the raw data from the Scouts, cross-references Reddit user sentiment against official specs.
    *   **Price Integrity**: It enforces a **Zero-Hallucination Protocol**, using verified numeric price data to calculate Fair Value (MSRP - Depreciation) rather than guessing.
    *   **SOTA Verification**: It applies **Bot/Astroturfing Detection** algorithms to Reddit threads and penalizes products with suspicious praise.
    *   **Output**: A detailed "Verdict" (Buy/Avoid/Consider) and a "Truth Score" calibrated to the current date (Jan 2026).

## ✨ Key Features
*   **🔍 Lens Search**: A unified, "command-line" style input for rapid product investigation.
*   **🆚 Versus Mode**: Compare two products side-by-side with component-level analysis.
*   **📉 Fairness Meter**: An algorithmic visualization that compares the *asking price* vs. the *fair market value* based on verified defects and competitor pricing.
*   **🎮 Gamified Field Reports**: Earn **XP** and rank up from **Window Shopper** to **Skeptek God** by submitting your own verified user reviews. Your community rank influences the weight of your reviews in the global analysis engine.
*   **🛡️ Analysis UI**: A "Glassmorphism" design system featuring scanlines, focal loaders, and high-contrast data displays.
*   **🧠 Hive Mind Memory (New!)**: A multi-modal caching system that remembers everything.
    *   **Visual Hashing**: Uploading a photo of a product instantly unlocks its text-based analysis (SHA-256).
    *   **Comparison Warming**: Analyzing "iPhone 15 vs S24" automatically pre-caches the individual data for both phones, making future searches instant.
    *   **Canonical Aliasing**: Intelligently links "Macbook M1" (alias) to "Apple MacBook Air 2020" (canonical), preventing redundant AI analysis.

## 🛠️ Tech Stack
*   **Brain (Frontend)**: Next.js 14, Tailwind CSS, Framer Motion
*   **Muscle (Backend)**: Python, Flask, Selenium, OpenCV
*   **Intelligence**: Google Gemini 3.0 (Flash & Pro Preview)
*   **Database**: Supabase (PostgreSQL, Realtime)

## 📦 Installation & Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Supabase Account** (for Auth & Database)
- **Google Cloud Platform Account** (for Gemini & Vertex AI)

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Core AI Keys (Gemini 3)
GOOGLE_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_data_api_key

# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key

# Google Cloud Vertex AI (Optional - for Enterprise Grounding)
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_CLOUD_LOCATION=global
VERTEX_SEARCH_DATA_STORE_ID=your_vertex_datastore_id
```

### 3. Install Dependencies

**Frontend (The Brain)**
```bash
npm install
```

**Backend (The Muscle)**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Running Skeptek

**Step 1: Ignite the Python Microservice**
This handles complex Selenium scraping and deep market verification.
```bash
# Terminal 1
python backend/main.py
# Runs on http://localhost:8000
```

**Step 2: Launch the Next.js Frontend**
The main application interface.
```bash
# Terminal 2
npm run dev
# Runs on http://localhost:3000
```

## 🏆 Hackathon Submission Details
*   **Challenge**: Build a NEW application using the Gemini 3 API.
*   **Innovation**: Skeptek moves beyond simple "chat" interfaces to a structured, agentic workflow that solves a real-world problem (consumer trust) using the speed and reasoning of Gemini 3.