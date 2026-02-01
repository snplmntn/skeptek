
// Self-Contained Probe for Google Search
// Usage: npx tsx scripts/probe-search.ts

import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

// Manual Env Load
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim().replace(/"/g, '');
            }
        });
    }
} catch (e) {
    console.warn("Could not load .env.local manually");
}

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY not found in env");
    process.exit(1);
}

const genAI = new GoogleGenAI({ apiKey });

async function probe() {
    console.log("🔎 Probing Search with Key...");
    try {
        const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: "What is the capital of France? Find a link." }] }],
            tools: [{ googleSearch: {} }]
        });
        
        console.log("✅ Success!");
        console.log("Text:", result.text?.substring(0, 50));
        console.log("Grounding:", JSON.stringify(result.candidates?.[0]?.groundingMetadata, null, 2));
    } catch (e: any) {
        console.error("❌ Failed:", e.message);
        if (e.response) console.error("Response:", await e.response.text());
    }
}

probe();
