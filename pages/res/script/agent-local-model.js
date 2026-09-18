const DATASET_URL = new URL('../data/agent-dataset.json', import.meta.url);
const MIN_CONFIDENCE = 0.19;

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9#._/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value).split(' ').filter(Boolean);
}

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
    const weight = (idf.get(key) || 1) * value;
    leftNorm += weight * weight;
    dot += weight * (idf.get(key) || 1) * (right.get(key) || 0);
  }
  for (const [key, value] of right) {
    const weight = (idf.get(key) || 1) * value;
    rightNorm += weight * weight;
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

/**
 * Addestramento locale supervisionato: TF-IDF su parole e trigrammi di caratteri.
 * Non scarica modelli, non invia prompt e non usa eval. Il dataset è modificabile
 * localmente e viene riaddestrato a ogni avvio dell'agente.
 */
export async function createLocalModel() {
  const response = await fetch(DATASET_URL);
  if (!response.ok) throw new Error(`Dataset locale non disponibile (${response.status})`);
  const dataset = await response.json();
  const documents = dataset.map((item) => vector(item.text));
  const documentFrequency = new Map();
  for (const document of documents) {
    for (const key of document.keys()) documentFrequency.set(key, (documentFrequency.get(key) || 0) + 1);
  }
  const idf = new Map([...documentFrequency].map(([key, count]) => [key, Math.log((documents.length + 1) / (count + 1)) + 1]));
  const centroids = new Map();
  for (let i = 0; i < dataset.length; i += 1) {
    const item = dataset[i];
    if (!centroids.has(item.intent)) centroids.set(item.intent, []);
    centroids.get(item.intent).push({ item, vector: documents[i] });
  }

  function predict(input) {
    const query = vector(input);
    const candidates = [...centroids].map(([intent, examples]) => {
      const ranked = examples.map((example) => ({
        ...example.item,
        score: cosine(query, example.vector, idf)
      })).sort((a, b) => b.score - a.score);
      const best = ranked[0] || { score: 0 };
      return { intent, score: best.score, topic: best.topic, features: best.features || [] };
    }).sort((a, b) => b.score - a.score);
    const best = candidates[0] || { intent: 'unknown', score: 0, topic: '' };
    if (best.score < MIN_CONFIDENCE) return { intent: 'unknown', confidence: best.score, topic: String(input || '') };
    return { ...best, confidence: Math.min(0.99, best.score), topic: topicFrom(input, best) };
  }

  return {
    predict,
    size: dataset.length,
    intents: [...centroids.keys()]
  };
}

export { normalize };
