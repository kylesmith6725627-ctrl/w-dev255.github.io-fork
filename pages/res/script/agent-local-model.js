const DATASET_URLS = [
  new URL('../data/agent-dataset.json', import.meta.url),
  new URL('../data/agent-public-api-dataset.json', import.meta.url)
];
const MIN_CONFIDENCE = 0.19;

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9#._/-]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function tokens(value) { return normalize(value).split(' ').filter(Boolean); }
function vector(value) {
  const result = new Map();
  for (const token of tokens(value)) {
    result.set(`w:${token}`, (result.get(`w:${token}`) || 0) + 1);
    for (let i = 0; i < token.length - 2; i += 1) {
      const gram = token.slice(i, i + 3);
      result.set(`c:${gram}`, (result.get(`c:${gram}`) || 0) + 0.25);
    }
  }
  return result;
}
function cosine(left, right, idf) {
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (const [key, value] of left) {
    const factor = idf.get(key) || 1;
    leftNorm += (factor * value) ** 2;
    dot += factor * value * factor * (right.get(key) || 0);
  }
  for (const [key, value] of right) {
    const factor = idf.get(key) || 1;
    rightNorm += (factor * value) ** 2;
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}
function topicFrom(input, prediction) {
  const raw = String(input || '').trim();
  const quoted = raw.match(/["“”']([^"“”']+)["“”']/);
  if (quoted) return quoted[1];
  const hash = raw.match(/#[a-z][\w-]*/i);
  if (hash) return `${prediction.topic || ''} ${hash[0]}`.trim();
  return prediction.topic || raw;
}

/** Local supervised TF-IDF model. All examples remain reviewed, local and offline. */
export async function createLocalModel() {
  const responses = await Promise.all(DATASET_URLS.map((url) => fetch(url)));
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`Dataset locale non disponibile (${failed.status})`);
  const parts = await Promise.all(responses.map((response) => response.json()));
  const dataset = parts.flat().filter((item) => item && item.text && item.intent);
  const documents = dataset.map((item) => vector(item.text));
  const frequency = new Map();
  documents.forEach((document) => document.keys().forEach((key) => frequency.set(key, (frequency.get(key) || 0) + 1)));
  const idf = new Map([...frequency].map(([key, count]) => [key, Math.log((documents.length + 1) / (count + 1)) + 1]));
  const centroids = new Map();
  dataset.forEach((item, index) => {
    if (!centroids.has(item.intent)) centroids.set(item.intent, []);
    centroids.get(item.intent).push({ item, vector: documents[index] });
  });

  function predict(input) {
    const query = vector(input);
    const candidates = [...centroids].map(([intent, examples]) => {
      const ranked = examples.map((example) => ({ ...example.item, score: cosine(query, example.vector, idf) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0] || { score: 0 };
      return { intent, score: best.score, topic: best.topic, features: best.features || [], language: best.language };
    }).sort((a, b) => b.score - a.score);
    const best = candidates[0] || { intent: 'unknown', score: 0, topic: '' };
    if (best.score < MIN_CONFIDENCE) return { intent: 'unknown', category: 'unknown', confidence: best.score, topic: String(input || ''), candidates };
    return {
      ...best,
      category: best.intent,
      confidence: Math.min(0.99, best.score),
      topic: topicFrom(input, best),
      candidates: candidates.slice(0, 3)
    };
  }
  return { predict, size: dataset.length, intents: [...centroids.keys()] };
}
export { normalize };