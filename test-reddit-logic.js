
const mockGroundingMetadata = {
    webSearchQueries: ["test query"],
    groundingChunks: [] // Empty to simulate failure
};

const mockText = JSON.stringify({
    threadTitle: "Test Consensus",
    comments: ["Test comment"],
    sentimentCount: { positive: 1, neutral: 0, negative: 0 },
    botProbability: 0,
    searchSuggestions: ["test"],
    sources: [
        { title: "Test Thread", url: "https://www.reddit.com/r/test/comments/123/test_thread/" },
        { title: "Google", url: "https://google.com" } // Should be filtered out
    ]
});

// Simulate the logic I just added
function testLogic() {
    let verifiedSources = [];
    const groundingChunks = mockGroundingMetadata.groundingChunks;

    if (groundingChunks && groundingChunks.length > 0) {
        // ... existing logic ...
    }

    const json = JSON.parse(mockText);

    if (verifiedSources.length > 0) {
        json.sources = verifiedSources.slice(0, 4);
    } else if (json.sources && Array.isArray(json.sources) && json.sources.length > 0) {
            // Validate these are reddit links
            json.sources = json.sources
            .filter((s) => s.url && s.url.includes('reddit.com'))
            .map((s) => ({
                title: s.title || "Reddit Thread",
                url: s.url,
                snippet: "Extracted from Model Response"
            }));
            
            if (json.sources.length > 0) {
                console.log(`[Reddit Scout] ⚠️ Recovered ${json.sources.length} sources from JSON body (Grounding Metadata was empty).`);
                verifiedSources = json.sources;
            }
    }

    if (verifiedSources.length === 0) {
        console.warn(`[Reddit Scout] ⚠️ No specific Reddit threads found via grounding or JSON. Using fallback.`);
    } else {
        console.log("SUCCESS: Found verified sources:", verifiedSources);
    }
}

testLogic();
