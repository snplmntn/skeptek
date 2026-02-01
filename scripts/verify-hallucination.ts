import { marketScout } from '../lib/agents/market-scout';
import { reviewScout } from '../lib/agents/review-scout';

async function main() {
    const url = "https://www.lazada.com.ph/products/pdp-i5252572047-s31158338527.html";
    console.log(`\n🔍 TESTING HALLUCINATION FIX for URL: ${url}`);
    
    console.log("\n--- Step 1: Testing Review Scout (Specific Scrape) ---");
    // This uses the Python scraper if available
    const reviewData = await reviewScout(url);
    if (reviewData) {
        console.log("✅ Review Scout Result:");
        console.log(`- Product Name: ${reviewData.productName || "MISSING"}`);
        console.log(`- Summary: ${reviewData.summary.substring(0, 50)}...`);
    } else {
        console.log("❌ Review Scout returned NULL (Scraper likely down)");
    }

    console.log("\n--- Step 2: Testing Market Scout (Orchestration) ---");
    // This triggers the new 'Override' logic
    const marketData = await marketScout(url);
    
    console.log("\n--- FINAL RESULT ---");
    if (marketData) {
        console.log(`Title: "${marketData.title}"`);
        console.log(`Specs Source: ${marketData.specs.Source}`);
        
        if (marketData.title.toLowerCase().includes("wanbo")) {
            console.log("\n✅ PASS: Correctly identified as Wanbo Projector");
        } else {
            console.log("\n❌ FAIL: Identified as something else (Hallucination persisting)");
        }
    } else {
        console.log("❌ Market Scout failed completely.");
    }
}

main().catch(console.error);
