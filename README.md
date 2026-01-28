# Skeptek 👁️
**Forensic Product Analysis Engine** | *Built for the Gemini 3 Hackathon*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/snplmntns-projects/v0-skeptek)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%203-4E8BF4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Status](https://img.shields.io/badge/Status-Beta-orange?style=for-the-badge)]()

> "The Minority Report for E-Commerce."

## 🚀 The Pitch
**Skeptek** is a "Precision Optics" engine designed to cut through the noise of the modern internet. In an era of AI-generated reviews, dropshipped white-label products, and inflated pricing, Skeptek acts as your forensic analyst.

It doesn't just "search" for a product. It **investigates** it. By deploying a swarm of specialized Gemini 3 agents, Skeptek triangulates data from official retailers, Reddit discussion threads, and YouTube video reviews to deliver a single, irrefutable **Truth Score**.

## 🧠 Powered by Gemini 3
Skeptek is built on a multi-agent architecture powered by the **Gemini 3.0 model family**. We leverage the massive context window and multimodal capabilities to perform deep forensic analysis that was previously impossible.

### The Agent Swarm
1.  **🕵️ Market Scout (Grounding Agent)**
    *   **Model**: `gemini-2.0-flash-exp` (via `latest` alias)
    *   **Role**: The first line of defense. It uses **Google Search Grounding** to traverse the live web, verifying product existence, current street pricing, and official technical specifications. It employs advanced hallucination-check protocols to ensure every data point is cited.

2.  **🎥 Video Sniper (Multimodal Hunter)**
    *   **Model**: `gemini-2.0-flash-exp`
    *   **Role**: A specialized agent that hunts for visual proof. It bypasses generic "unboxing" videos to find critical "deep dive" reviews. It understands *context*—scanning video titles and metadata to distinguish between a paid promotion and a brutal, honest review.

3.  **⚖️ The Judge (Reasoning Core)**
    *   **Model**: `gemini-1.5-pro` / `gemini-3.0-pro`
    *   **Role**: The synthesis engine. It ingests the raw data from the Scouts, cross-references Reddit user sentiment against official specs, and produces the final **Truth Score**.
    *   **Output**: A detailed "Verdict" (Buy/Avoid/Consider) and a "Fairness Meter" calculation.

## ✨ Key Features
*   **🔍 Lens Search**: A unified, "command-line" style input for rapid product investigation.
*   **🆚 Versus Mode**: Compare two products side-by-side with forensic component-level analysis.
*   **📉 Fairness Meter**: An algorithmic visualization that compares the *asking price* vs. the *fair market value* based on verified defects and competitor pricing.
*   **🛡️ Forensic UI**: A "Glassmorphism" design system featuring scanlines, focal loaders, and high-contrast data displays.

## 🛠️ Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **AI SDK**: Google Generative AI SDK (`@google/generative-ai`)
*   **Styling**: Tailwind CSS, Framer Motion, Lucide React
*   **Deployment**: Vercel

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
```

Run the forensic engine:
```bash
npm run dev
```

## 🏆 Hackathon Submission Details
*   **Challenge**: Build a NEW application using the Gemini 3 API.
*   **Innovation**: Skeptek moves beyond simple "chat" interfaces to a structured, agentic workflow that solves a real-world problem (consumer trust) using the speed and reasoning of Gemini 3.