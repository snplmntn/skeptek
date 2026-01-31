
// Probe Script for Vertex AI API Key
// Usage: npx tsx scripts/probe-vertex.ts

// Load Env
if (process.loadEnvFile) { try { process.loadEnvFile('.env.local'); } catch (e) {} }

const apiKey = process.env.GOOGLE_API_KEY || "";
const projectId = process.env.GOOGLE_CLOUD_PROJECT || "skeptek-hackathon";
const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

async function probeModel(modelId: string) {
    console.log(`\n🔎 Probing Model: ${modelId}`);
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
    
    console.log(`   URL: https://${location}-aiplatform.googleapis.com/.../models/${modelId}:generateContent`);
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
            })
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const text = await response.text();
            console.log(`   Error Body: ${text.substring(0, 300)}...`);
        } else {
            console.log("   ✅ SUCCESS! API Key works.");
            const data = await response.json();
            // @ts-ignore
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`   Response: "${answer?.substring(0, 50)}..."`);
        }
    } catch (e: any) {
        console.log("   Exception:", e.message);
    }
}

async function run() {
    console.log(`🔑 Key: ${apiKey.substring(0, 8)}...`);
    // Test 1: Known Good Model
    await probeModel("gemini-1.5-flash-001");
    
    // Test 2: Gemini 2.0
    await probeModel("gemini-2.0-flash-exp");

    // Test 3: Gemini 3 (Target)
    await probeModel("gemini-3-flash-preview");
}

run();
