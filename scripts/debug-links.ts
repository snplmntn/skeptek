
import { checkLinkValidity } from '../lib/link-verifier';

/**
 * DEBUG SCRIPT: Zero-Trust Link Diagnosis
 * Runs checkLinkValidity against specific "troublemaker" URLs and logs strict status codes.
 */

async function debugLinks() {
  console.log("🔍 Starting Link Diagnostics...\n");

  const targets = [
    // 1. Reddit (Known 429/403 issues)
    { 
      type: "REDDIT (Valid)", 
      url: "https://www.reddit.com/r/MouseReview/comments/1es9aix/vxe_mad_r_major_initial_impressions/" 
    },
    // 2. YouTube (oEmbed issues)
    { 
      type: "YOUTUBE (Valid)", 
      url: "https://www.youtube.com/watch?v=Oa-fT_C_vLw" 
    },
    // 3. Shopee (Failed Scraping - 429)
    {
      type: "SHOPEE (Scraping Target)",
      url: "https://shopee.ph/VXE-MAD-R-R-MAJOR-wireless-dual-mode-gaming-mouse-PAW3395-3950-supports-wired-wireless-8k-i.368885895.26706447932"
    }
  ];

  for (const target of targets) {
    console.log(`[Testing] ${target.type}`);
    console.log(`URL: ${target.url}`);
    const start = Date.now();
    const result = await checkLinkValidity(target.url);
    const time = Date.now() - start;
    
    console.log(`Result: ${result ? "✅ VALID" : "❌ INVALID"}`);
    console.log(`Time: ${time}ms`);
    console.log("---------------------------------------------------");
  }
}

// We need to slightly modify checkLinkValidity to Log the ERROR reason if we want deeper debugging,
// but for now let's see if the boolean result matches expectation.
debugLinks();
