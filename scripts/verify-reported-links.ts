
import { checkLinkValidity } from '../lib/link-verifier';

const targets = [
    // From User Log (Reddit Scout)
    "https://www.reddit.com/r/MouseReview/comments/1ee8nnu/vxe_mad_r_major_initial_thoughts/",
    "https://www.reddit.com/r/MouseReview/comments/1e8rscs/vxe_mad_r_36g_3950_8k_is_here/",
    
    // From User Log (Video Scout)
    "https://www.youtube.com/watch?v=yYjF7r5x7L0",
    "https://www.youtube.com/watch?v=FqS_W_iM_G8"
];

async function run() {
    console.log("🔍 Verifying Reported Links...");
    for (const url of targets) {
        const isValid = await checkLinkValidity(url);
        console.log(`[${isValid ? '✅ VALID' : '❌ DEAD'}] ${url}`);
    }
}

run();
