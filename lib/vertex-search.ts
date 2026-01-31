"use server";

// Replaced Client Library with REST to avoid "Default Credentials" (ADC) issues locally.
// We use the GOOGLE_API_KEY directly.

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'global';
const collectionId = 'default_collection';
const dataStoreId = process.env.VERTEX_SEARCH_DATA_STORE_ID;
const apiKey = process.env.GOOGLE_API_KEY;

export interface VertexSearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchVertexAI(query: string): Promise<VertexSearchResult[]> {
  if (!projectId || !dataStoreId || !apiKey) {
    console.error("❌ Missing GOOGLE_CLOUD_PROJECT, VERTEX_SEARCH_DATA_STORE_ID, or GOOGLE_API_KEY");
    return [];
  }

  // REST Endpoint for Discovery Engine
  // Docs: https://cloud.google.com/generative-ai-app-builder/docs/reference/rest/v1beta/projects.locations.collections.dataStores.servingConfigs/search
  const endpoint = `https://discoveryengine.googleapis.com/v1beta/projects/${projectId}/locations/${location}/collections/${collectionId}/dataStores/${dataStoreId}/servingConfigs/default_search:search?key=${apiKey}`;

  const requestBody = {
    query: query,
    pageSize: 5,
    // Optional: snippet sizing
    contentSearchSpec: {
        snippetSpec: { returnSnippet: true }
    }
  };

  try {
    console.log(`[Vertex AI] 🔍 Searching (REST): "${query}"`);
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Vertex AI] HTTP Error ${response.status}:`, errorText);
        throw new Error(`Vertex AI API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Parse results
    const results: VertexSearchResult[] = [];
    
    // @ts-ignore
    for (const result of data.results || []) {
       const structData = result.document?.derivedStructData;
       if (structData) {
           results.push({
               title: structData.title || "No Title",
               link: structData.link || "",
               snippet: structData.snippets?.[0]?.snippet || ""
           });
       }
    }

    console.log(`[Vertex AI] ✅ Found ${results.length} results.`);
    return results;

  } catch (error) {
    console.warn("[Vertex AI] Search failed:", error);
    return [];
  }
}
