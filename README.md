# Skeptek app design

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/snplmntns-projects/v0-skeptek)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/hzh3lPCUIo3)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/snplmntns-projects/v0-skeptek](https://vercel.com/snplmntns-projects/v0-skeptek)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/hzh3lPCUIo3](https://v0.app/chat/hzh3lPCUIo3)**

## How It Works

Skeptek operates as a "Precision Optics" engine for product intelligence, filtering out noise to find the signal.

1.  **The Fan-Out (Data Gathering)**:
    *   **MarketMercenary**: Scrapes official specs and pricing from varied retailers (Shopee, Amazon).
    *   **RedditScout**: Aggregates real user discussions using the **Reddit API** (`asyncpraw`), filtering for high-value comments.
    *   **VideoSniper**: Analyzes YouTube transcripts to find timestamps where reviewers discuss physical defects (hinges, scratches).

2.  **The Logic (Gemini 3.0 Agents)**:
    *   **Global Sentry** (`gemini-3.0-flash`): Checks voltage/region compatibility and estimates import taxes.
    *   **Arbitrage Detector** (`gemini-3.0-pro`): Detects if a product is a dropshipped white-label item by reverse-searching images.
    *   **The Watcher** (`gemini-3.0-pro-vision`): Watches 10s video clips to visually confirm defects reported in text.
    *   **The Judge** (`gemini-3.0-pro`): Synthesizes all data into a final "Truth Score" and verdict.

3.  **The Presentation**:
    *   A Next.js frontend displays the "Truth Score", verified pros/cons, and interactive fairness meter.