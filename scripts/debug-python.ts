
async function probe() {
    console.log("🔍 Probing Python Backend...");

    // 1. Test /verify with a known valid Reddit link
    const redditUrl = "https://www.reddit.com/r/Huawei/comments/1d7v6p5/huawei_matepad_115_s_papermatte_edition_initial/";
    try {
        console.log(`\nTesting /verify on: ${redditUrl}`);
        const res = await fetch("http://localhost:8000/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: redditUrl })
        });
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", data);
    } catch (e) {
        console.error("Verify Probe Failed:", e);
    }

    // 2. Test /transcript with a failing video ID (from user logs)
    const videoId = "-qDjXvhu8R0"; 
    try {
        console.log(`\nTesting /transcript on: ${videoId}`);
        const res = await fetch(`http://localhost:8000/transcript?video_id=${videoId}`);
        const data = await res.text();
        console.log("Status:", res.status);
        console.log("Body:", data);
    } catch (e) {
        console.error("Transcript Probe Failed:", e);
    }
}

probe();
