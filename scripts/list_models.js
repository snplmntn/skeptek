const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
      console.error("No .env.local found");
      process.exit(1);
  }
  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/GOOGLE_API_KEY=(.+)/);
  if (!match) throw new Error("Key not found in .env.local");
  const key = match[1].trim();

  console.log("Fetching models with key: " + key.substring(0, 5) + "...");

  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        console.error("API Error:", data.error);
      } else {
        console.log("\nAVAILABLE MODELS:");
        // Filter for gemini models to be concise
        const models = data.models
            ?.filter(m => m.name.includes('gemini'))
            .map(m => m.name.replace('models/', '')) 
            || [];
        console.log(JSON.stringify(models, null, 2));
      }
    })
    .catch(e => console.error("Fetch Error:", e));
} catch (e) {
  console.error("Script Error:", e);
}
