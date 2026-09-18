const MAX_EXAMPLES = 80;
const MAX_DEPTH = 5;
const MIN_LEAF_SIZE = 2;

const STEP_LIBRARY = {
  js: ['identifica l obiettivo e i dati di ingresso', 'scomponi la richiesta in capacità riutilizzabili', 'genera il codice JavaScript', 'verifica errori e casi limite'],
  fetch: ['definisci endpoint e metodo HTTP', 'costruisci richiesta e payload', 'gestisci risposta, errori e stato di caricamento'],
  form: ['individua i campi e i vincoli', 'valida i dati prima dell invio', 'gestisci submit e feedback all utente'],
  storage: ['definisci una chiave stabile', 'serializza e salva lo stato', 'gestisci dati mancanti o corrotti'],
  dom: ['individua selettori ed eventi', 'collega gli event listener', 'aggiorna il DOM in modo sicuro'],
  array: ['definisci la trasformazione desiderata', 'applica map, filter, reduce o sort', 'controlla il risultato con dati rappresentativi'],
  async: ['separa operazioni asincrone e UI', 'gestisci attesa, successo ed errore', 'evita richieste duplicate o stati incoerenti'],
  navigation: ['riconosci la destinazione', 'verifica che la pagina sia disponibile', 'esegui la navigazione'],
  help: ['interpreta la richiesta', 'seleziona le funzionalità disponibili'],
  time: ['determina il fuso e il formato', 'restituisci data e ora locali']
};

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function tokens(value) { return [...new Set(normalize(value).split(' ').filter((token) => token.length > 2))]; }

function featureSet(example) {
  const text = normalize(`${example.input || ''} ${example.topic || ''} ${(example.features || []).join(' ')}`);
  const words = tokens(text);
  const featureWords = ['fetch', 'api', 'form', 'modulo', 'storage', 'localstorage', 'array', 'button', 'bottone', 'click', 'event', 'async', 'await', 'error', 'errore', 'modal', 'email', 'validazione', 'navigation', 'pagina', 'test'];
  return new Set([...words.filter((word) => word.length >= 5), ...featureWords.filter((word) => text.includes(word))]);
}

function entropy(examples) {
  const counts = new Map();
  examples.forEach((item) => counts.set(item.label, (counts.get(item.label) || 0) + 1));
  return [...counts.values()].reduce((sum, count) => {
    const probability = count / examples.length;
    return sum - probability * Math.log2(probability);
  }, 0);
}

function majority(examples) {
  const counts = new Map();
  examples.forEach((item) => counts.set(item.label, (counts.get(item.label) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
}

function buildTree(examples, depth = 0) {
  const labels = new Set(examples.map((item) => item.label));
  if (!examples.length || labels.size === 1 || depth >= MAX_DEPTH || examples.length < MIN_LEAF_SIZE) {
    return { type: 'leaf', label: majority(examples) };
  }
  const candidates = [...new Set(examples.flatMap((item) => item.features))];
  const parentEntropy = entropy(examples);
  let best = null;
  for (const feature of candidates) {
    const yes = examples.filter((item) => item.features.has(feature));
    const no = examples.filter((item) => !item.features.has(feature));
    if (!yes.length || !no.length) continue;
    const gain = parentEntropy - (yes.length / examples.length) * entropy(yes) - (no.length / examples.length) * entropy(no);
    if (!best || gain > best.gain) best = { feature, gain, yes, no };
  }
  if (!best || best.gain <= 0.01) return { type: 'leaf', label: majority(examples) };
  return { type: 'node', feature: best.feature, yes: buildTree(best.yes, depth + 1), no: buildTree(best.no, depth + 1) };
}

function predict(tree, features) {
  let node = tree;
  while (node?.type === 'node') node = features.has(node.feature) ? node.yes : node.no;
  return node?.label || 'unknown';
}

function collectExamples(state) {
  return (state.context?.turns || []).filter((turn) => turn.input && turn.intent && turn.intent !== 'unknown')
    .slice(-MAX_EXAMPLES).map((turn) => ({ ...turn, label: turn.intent, features: featureSet(turn) }));
}

function stepsFor(label, input) {
  const text = normalize(input);
  const steps = [...(STEP_LIBRARY[label] || STEP_LIBRARY.js)];
  const extra = [];
  if (/test|prova|verifica/.test(text)) extra.push('esegui test manuali e verifica il comportamento atteso');
  if (/accessib|accessibil/.test(text)) extra.push('controlla tastiera, focus e attributi ARIA');
  if (/sicuro|sicura|sicurezza|sanitiz/.test(text)) extra.push('valida e limita gli input prima di usarli');
  return [...steps, ...extra].filter((step, index, list) => list.indexOf(step) === index);
}

export function createDecisionTree(state) {
  const examples = collectExamples(state);
  const tree = buildTree(examples);
  return {
    tree,
    examples: examples.length,
    predict(input, hint = {}) {
      const features = featureSet({ input, ...hint });
      const label = predict(tree, features);
      return { intent: label === 'unknown' ? (hint.intent || 'js') : label, steps: stepsFor(label === 'unknown' ? (hint.intent || 'js') : label, input) };
    },
    describe(node = tree, prefix = '') {
      if (node.type === 'leaf') return [`${prefix}=> ${node.label}`];
      return [`${prefix}se ${node.feature}:`, ...this.describe(node.yes, `${prefix}  `), `${prefix}altrimenti:`, ...this.describe(node.no, `${prefix}  `)];
    }
  };
}

export function formatTaskPlan(plan, examples) {
  return `Decision tree (${examples} contenuti appresi, ${plan.intent}):\n${plan.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`;
}
