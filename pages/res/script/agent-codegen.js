const RECIPES_URL = new URL('../data/agent-code-recipes.json', import.meta.url);

const HELP = 'Generazione JS avanzata: js <richiesta>. Componi UI, fetch/API, form, storage, async, array, eventi, moduli, accessibilità e test. Il risultato è locale e non viene troncato.';
const recipePromise = fetch(RECIPES_URL).then((response) => {
  if (!response.ok) throw new Error(`Dataset ricette non disponibile (${response.status})`);
  return response.json();
}).catch(() => []);

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9#._/:?&=\s-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsString(value) { return JSON.stringify(String(value)); }
function has(text, terms) { return terms.some((term) => text.includes(normalize(term))); }
function selector(request, fallback = '#target') { return String(request).match(/#[a-zA-Z][\w-]*/)?.[0] || fallback; }
function url(request) { return String(request).match(/https?:\/\/[^\s"']+|(?:\/|\.\/)[^\s"']+/i)?.[0]?.replace(/[),.;]+$/, '') || '/api/data'; }
function quoted(request, fallback = 'Operazione completata!') { return String(request).match(/["“”']([^"“”']+)["“”]/)?.[1] || fallback; }
function event(request) {
  const text = normalize(request);
  if (has(text, ['submit', 'invio', 'form'])) return 'submit';
  if (has(text, ['input', 'digit', 'typing', 'digita'])) return 'input';
  if (has(text, ['change', 'cambia'])) return 'change';
  if (has(text, ['mouseover', 'hover', 'passaggio'])) return 'mouseover';
  return 'click';
}

function scoreRecipe(text, recipe) {
  const terms = [...(recipe.terms || []), ...(recipe.tags || [])];
  return terms.reduce((score, term) => {
    const value = normalize(term);
    return score + (text.includes(value) ? (value.includes(' ') ? 4 : 2) : 0);
  }, 0);
}

function block(name, code) { return `// ===== ${name} =====\n${code.trim()}`; }

function buttonBlock(request) {
  const target = selector(request, '#my-button');
  const message = quoted(request);
  return block('DOM + evento', `const element = document.querySelector(${jsString(target)});\nif (!element) throw new Error('Elemento ${target} non trovato.');\nelement.addEventListener(${jsString(event(request))}, () => {\n  element.setAttribute('aria-busy', 'true');\n  console.log(${jsString(message)});\n  element.removeAttribute('aria-busy');\n});`);
}

function fetchBlock(request) {
  const endpoint = url(request);
  const method = has(normalize(request), ['post', 'put', 'patch', 'invia', 'crea']) ? 'POST' : 'GET';
  const payload = method === 'GET' ? '' : `\nconst payload = { message: ${jsString(quoted(request, 'hello'))} };`;
  return block('fetch + gestione errori', `${payload}\nasync function requestData(endpoint = ${jsString(endpoint)}) {\n  const response = await fetch(endpoint, {\n    method: ${jsString(method)},\n    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },\n    ${method === 'GET' ? '' : 'body: JSON.stringify(payload),'}\n  });\n  if (!response.ok) throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);\n  return response.status === 204 ? null : response.json();\n}\n\nrequestData().then(console.log).catch((error) => console.error('Richiesta fallita:', error));`);
}

function formBlock(request) {
  const target = selector(request, '#my-form');
  const email = has(normalize(request), ['email', 'mail']);
  return block('form + validazione', `const form = document.querySelector(${jsString(target)});\nif (!form) throw new Error('Form ${target} non trovato.');\n\nform.addEventListener('submit', (event) => {\n  event.preventDefault();\n  const data = new FormData(form);${email ? `\n  const email = String(data.get('email') || '').trim();\n  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {\n    form.elements.email?.setAttribute('aria-invalid', 'true');\n    form.elements.email?.focus();\n    return;\n  }` : ''}\n  console.log('Dati validi:', Object.fromEntries(data));\n});`);
}

function storageBlock(request) {
  const key = String(request).match(/(?:chiave|key)\s+["']?([\w-]+)/i)?.[1] || 'app-settings';
  return block('persistenza locale', `const STORAGE_KEY = ${jsString(key)};\n\nexport function loadSettings(fallback = {}) {\n  try {\n    const value = localStorage.getItem(STORAGE_KEY);\n    return value ? { ...fallback, ...JSON.parse(value) } : fallback;\n  } catch (error) {\n    console.warn('Impostazioni non leggibili:', error);\n    return fallback;\n  }\n}\n\nexport function saveSettings(settings) {\n  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));\n}`);
}

function arrayBlock(request) {
  const text = normalize(request);
  const operation = has(text, ['reduce', 'somma', 'sum']) ? 'reduce' : has(text, ['sort', 'ordina']) ? 'sort' : has(text, ['filter', 'filtra']) ? 'filter' : 'map';
  const expression = { map: '(value) => value * 2', filter: '(value) => value > 0', sort: '(a, b) => String(a.name).localeCompare(String(b.name))', reduce: '(total, value) => total + value, 0' }[operation];
  return block('array + trasformazione', `const values = [3, -1, 4, 2];\nconst result = values.${operation}(${expression});\nconsole.log(result);`);
}

function asyncBlock() {
  return block('async utilities', `function delay(milliseconds) {\n  return new Promise((resolve) => setTimeout(resolve, milliseconds));\n}\n\nasync function withLoading(button, task) {\n  const label = button?.textContent;\n  if (button) { button.disabled = true; button.textContent = 'Caricamento...'; }\n  try { return await task(); }\n  finally {\n    if (button) { button.disabled = false; button.textContent = label; }\n  }\n}`);
}

function debounceBlock(request) {
  return block('debounce', `function debounce(callback, delay = 300) {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => callback(...args), delay);\n  };\n}\n\nconst input = document.querySelector(${jsString(selector(request, '#search'))});\ninput?.addEventListener('input', debounce((event) => console.log(event.target.value)));`);
}

function modalBlock() {
  return block('dialog accessibile', `const dialog = document.querySelector('#modal');\nconst open = document.querySelector('#open-modal');\nconst close = document.querySelector('#close-modal');\nopen?.addEventListener('click', () => dialog?.showModal());\nclose?.addEventListener('click', () => dialog?.close());\ndialog?.addEventListener('click', (event) => {\n  if (event.target === dialog) dialog.close();\n});`);
}

function genericBlock(request) {
  return block('funzione estendibile', `/**\n * Implementazione locale per: ${String(request).replace(/\*\//g, '* /')}\n * Punto di partenza sicuro e facilmente estendibile.\n */\nexport function generatedTask(input, options = {}) {\n  const result = { input, options, timestamp: new Date().toISOString() };\n  return result;\n}`);
}

function detectBlocks(request) {
  const text = normalize(request);
  const blocks = [];
  const add = (id, code) => { if (!blocks.some(([name]) => name === id)) blocks.push([id, code]); };
  if (has(text, ['fetch', 'api', 'http', 'rete', 'request', 'richiesta'])) add('fetch', fetchBlock(request));
  if (has(text, ['form', 'modulo', 'validazione', 'validate'])) add('form', formBlock(request));
  if (has(text, ['localstorage', 'storage', 'preferenze', 'persist'])) add('storage', storageBlock(request));
  if (has(text, ['array', 'lista', 'filter', 'filtra', 'reduce', 'somma', 'sort', 'ordina', 'map'])) add('array', arrayBlock(request));
  if (has(text, ['debounce', 'ritardo', 'typing', 'digit'])) add('debounce', debounceBlock(request));
  if (has(text, ['modal', 'dialog', 'finestra'])) add('modal', modalBlock());
  if (has(text, ['async', 'await', 'loading', 'caricamento', 'retry', 'asincrono'])) add('async', asyncBlock());
  if (has(text, ['button', 'bottone', 'click', 'clic', 'evento', 'event', 'listener'])) add('dom', buttonBlock(request));
  return blocks;
}

export async function generateJavaScript(request) {
  const original = String(request || '').trim();
  if (!original) return `Uso: js <richiesta>. ${HELP}`;
  const text = normalize(original);
  const recipes = await recipePromise;
  const matches = recipes
    .map((recipe) => ({ recipe, score: scoreRecipe(text, recipe) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  const parts = [`// Richiesta: ${original}`, `// Generazione locale compositiva; ricette abbinate: ${matches.map(({ recipe }) => recipe.id).join(', ') || 'nessuna'}`];
  const blocks = detectBlocks(original);
  const seen = new Set();
  for (const { recipe } of matches.slice(0, 3)) {
    if (!seen.has(recipe.id)) { parts.push(block(recipe.id, recipe.code)); seen.add(recipe.id); }
  }
  for (const [id, code] of blocks) {
    if (!seen.has(id)) { parts.push(code); seen.add(id); }
  }
  if (!blocks.length && !matches.length) parts.push(genericBlock(original));
  return parts.join('\n\n');
}

export function getJavaScriptGeneratorHelp() { return HELP; }
