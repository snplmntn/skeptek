
import { checkLinkValidity } from '@/lib/link-verifier';

/**
 * Anti-Hallucination Verification Probe
 * Verifies that our link-verifier correctly distinguishes between real and hallucinated links.
 */

async function runTest() {
    console.log("🚀 Starting Zero-Trust Verification Probe...\n");

    const tests = [
        {
            name: "Valid YouTube Video",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            expected: true
        },
        {
            name: "Hallucinated YouTube Video (Fake ID)",
            url: "https://www.youtube.com/watch?v=FAKE_ID_1234",
            expected: false
        },
        {
            name: "Valid Reddit Thread",
            url: "https://www.reddit.com/r/MechanicalKeyboards/comments/yqw0u8/akko_5075s_review_great_entry_level_gasket_mount/",
            expected: true
        },
        {
            name: "Hallucinated Reddit Thread (Fake Slug)",
            url: "https://www.reddit.com/r/MechanicalKeyboards/comments/fake_slug_1234/does_not_exist/",
            expected: false
        }
    ];

    for (const test of tests) {
        console.log(`[Testing] ${test.name}...`);
        console.log(` URL: ${test.url}`);
        
        try {
            const result = await checkLinkValidity(test.url);
            const pass = result === test.expected;
            
            console.log(` Result: ${result ? "VALID ✅" : "INVALID ❌"}`);
            console.log(` Status: ${pass ? "PASS" : "FAIL 🚨"}\n`);
            
            if (!pass) {
                console.error(`ERROR: Test failed for ${test.name}`);
                process.exit(1);
            }
        } catch (e: any) {
            console.error(`ERROR: Test crashed for ${test.name}: ${e.message}\n`);
            process.exit(1);
        }
    }

    console.log("✨ All Verification Tests Passed! Zero-Trust Layer is Active.");
}

runTest();
