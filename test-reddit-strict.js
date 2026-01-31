
const mockGroundingMetadata = {
    webSearchQueries: ["test query"],
    groundingChunks: [] // Empty
};

// JSON contains hallucinated sources
const mockText = JSON.stringify({
    threadTitle: "Test Consensus",
    comments: ["Test comment"],
    sentimentCount: { positive: 1, neutral: 0, negative: 0 },
    botProbability: 0,
    searchSuggestions: ["test"],
    sources: [
        { title: "Hallucinated Thread", url: "https://www.reddit.com/r/nonexistent" } 
    ]
});

const optimizedQuery = "Test Query";

function testLogic() {
    let verifiedSources = [];
    const groundingChunks = mockGroundingMetadata.groundingChunks;

    if (groundingChunks && groundingChunks.length > 0) {
        // ... Logic for extracting chunk ...
    }

    const json = JSON.parse(mockText);

    // Strict Logic: Ignore JSON sources
    if (verifiedSources.length > 0) {
        json.sources = verifiedSources.slice(0, 4);
    } else {
        // Fallback
        json.sources = [{
            title: "Reddit Search Results",
            url: `https://www.google.com/search?q=site:reddit.com+${encodeURIComponent(optimizedQuery)}`,
            snippet: "Click to explore discussions"
        }];
        console.warn(`[Reddit Scout] ⚠️ No grounding chunks found. Using Search Fallback.`);
    }

    console.log("FINAL SOURCES:", json.sources);
    
    if (json.sources[0].title === "Reddit Search Results") {
        console.log("SUCCESS: Correctly fell back to search link instead of using hallucinated JSON source.");
    } else {
        console.log("FAILURE: Used hallucinated source.");
    }
}

testLogic();
