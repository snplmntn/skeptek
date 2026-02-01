
import { analyzeProduct } from '../app/actions/analyze';

async function runTest() {
  console.log("--- TEST 1: Missing Product ---");
  try {
    const result = await analyzeProduct("asdfghjkl12345");
    console.log("Result (Should not happen):", result);
  } catch (error: any) {
    console.log("Caught Expected Error:", error.message);
  }

  console.log("\n--- TEST 2: Valid Product (Mocking Rate Limit Context indirectly by checking if it fails gracefully) ---");
  // This depends on the actual environment, but we want to see if it handles 'null' results from scouts.
  try {
    const { result } = await analyzeProduct("iPhone 15");
    // In a real test environment with StreamableValues, we'd use readStreamableValue
    // For now, let's just log that we got the stream object
    console.log("Analysis Stream Started for iPhone 15");
  } catch (error: any) {
    console.log("Analysis Failed:", error.message);
  }
}

runTest();
