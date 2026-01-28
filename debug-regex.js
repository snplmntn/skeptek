const query = "Product A vs Product B vs Product C vs Product D";
const comparisonMarkers = [' vs ', ' versus ', ' or ', ' compare '];
const splitRegex = new RegExp(comparisonMarkers.join('|'), 'gi');

console.log("Query:", query);
console.log("Regex:", splitRegex);

const candidates = query.split(splitRegex).map(s => s.trim()).filter(s => s.length > 0);
console.log("Candidates:", candidates);

const items = Array.from(new Set(candidates)).slice(0, 4);
console.log("Items:", items);
console.log("Count:", items.length);
