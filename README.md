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
    *   **Role**: The first line of defense. It uses **Google Search Grounding** to traverse the live web, verifying product existence, current street pricing, and official technical specifications. 
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
    *   **SOTA Verification**: It applies **Bot/Astroturfing Detection** algorithms to Reddit threads and penalizes products with suspicious praise.
    *   **Output**: A detailed "Verdict" (Buy/Avoid/Consider) and a "Truth Score" calibrated to the current date (Jan 2026).

## ✨ Key Features
*   **🔍 Lens Search**: A unified, "command-line" style input for rapid product investigation.
*   **🆚 Versus Mode**: Compare two products side-by-side with component-level analysis.
*   **📉 Fairness Meter**: An algorithmic visualization that compares the *asking price* vs. the *fair market value* based on verified defects and competitor pricing.
*   **🎮 Gamified Field Reports**: Earn **XP** and rank up from **Window Shopper** to **Skeptek God** by submitting your own verified user reviews. Your community rank influences the weight of your reviews in the global analysis engine.
*   **🛡️ Analysis UI**: A "Glassmorphism" design system featuring scanlines, focal loaders, and high-contrast data displays.

## 🛠️ Tech Stack
*   **Brain (Frontend)**: Next.js 14, Tailwind CSS, Framer Motion
*   **Muscle (Backend)**: Python, Flask, Selenium, OpenCV
*   **Intelligence**: Google Gemini 3.0 (Flash & Pro Preview)
*   **Database**: Supabase (PostgreSQL, Realtime)

## 📦 Installation
Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/skeptek.git
cd skeptek
npm install
```

Set up your environment variables:
```bash
# .env.local
GOOGLE_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Run the Python Backend (The Muscle):
```bash
# In a new terminal
pip install -r backend/requirements.txt
python backend/main.py
```

Run the Next.js Frontend (The Brain):
```bash
# In a separate terminal
npm run dev
```

## 🏆 Hackathon Submission Details
*   **Challenge**: Build a NEW application using the Gemini 3 API.
*   **Innovation**: Skeptek moves beyond simple "chat" interfaces to a structured, agentic workflow that solves a real-world problem (consumer trust) using the speed and reasoning of Gemini 3.