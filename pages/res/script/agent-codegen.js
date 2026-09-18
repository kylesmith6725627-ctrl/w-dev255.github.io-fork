const HELP = 'Generazione dinamica: js <richiesta>. Combina bottone, fetch/API, localStorage, debounce, array, evento, modulo, form, modal e timer.';

const DEFAULT_SELECTOR = '#target';

function normalize(text) {
  return String(text || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9#._:/?&=-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsString(value) {
  return JSON.stringify(String(value));
}

function selectorFrom(request, fallback = DEFAULT_SELECTOR) {
  const match = String(request).match(/#[a-zA-Z][\w-]*/);
  return match ? match[0] : fallback;
}

function quotedText(request, fallback) {
  const match = String(request).match(/["'“”]([^"'“”]+)["'“”]/);
  return match ? match[1] : fallback;
}

function urlFrom(request) {
  const quoted = quotedText(request, '');
  if (quoted && /^(https?:\/\/|\/|\w+\.)/.test(quoted)) return quoted;
  const match = String(request).match(/https?:\/\/[^\s"']+|(?:\/|\.\/)[^\s"']+/i);
  return match ? match[0].replace(/[),.;]+$/, '') : '/data.json';
}

function hasAny(text, values) {
  return values.some((value) => text.includes(normalize(value)));
}

function indent(code, spaces = 2) {
  const prefix = ' '.repeat(spaces);
  return code.split('\n').map((line) => line ? prefix + line : line).join('\n');
}

function eventNameFrom(request) {
  const text = normalize(request);
  if (text.includes('submit') || text.includes('invio')) return 'submit';
  if (text.includes('input') || text.includes('digit')) return 'input';
  if (text.includes('change') || text.includes('cambia')) return 'change';
  if (text.includes('mouseover') || text.includes('passaggio')) return 'mouseover';
  return 'click';
}

function messageFrom(request) {
  return quotedText(request, 'Operazione completata!');
}

function generateButton(request) {
  const selector = selectorFrom(request, '#my-button');
  const message = messageFrom(request);
  return `const element = document.querySelector(${jsString(selector)});\n\nif (!element) {\n  throw new Error('Elemento ${selector} non trovato.');\n}\n\nelement.addEventListener(${jsString(eventNameFrom(request))}, () => {\n  const output = document.querySelector('#output');\n  if (output) output.textContent = ${jsString(message)};\n});`;
}

function generateFetch(request) {
  const url = urlFrom(request);
  const method = hasAny(normalize(request), ['post', 'invia', 'crea']) ? 'POST' : 'GET';
  const body = method === 'POST'
    ? `\n  body: JSON.stringify(payload),`
    : '';
  const payload = method === 'POST'
    ? `\nconst payload = { message: ${jsString(messageFrom(request))} };\n`
    : '';
  return `${payload}\nasync function requestData(url = ${jsString(url)}) {\n  const response = await fetch(url, {\n    method: ${jsString(method)},\n    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },${body}\n  });\n\n  if (!response.ok) {\n    throw new Error(\`HTTP error: \${response.status}\`);\n  }\n\n  return response.status === 204 ? null : response.json();\n}\n\nrequestData()\n  .then((data) => console.log('Risposta:', data))\n  .catch((error) => console.error('Richiesta fallita:', error));`;
}

function generateStorage(request) {
  const keyMatch = String(request).match(/(?:chiave|key)\s+["']?([\w-]+)/i);
  const key = keyMatch ? keyMatch[1] : 'app-settings';
  return `const STORAGE_KEY = ${jsString(key)};\n\nexport function saveValue(value) {\n  try {\n    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));\n  } catch (error) {\n    console.error('Salvataggio fallito:', error);\n  }\n}\n\nexport function readValue(fallback = {}) {\n  try {\n    const value = localStorage.getItem(STORAGE_KEY);\n    return value === null ? fallback : JSON.parse(value);\n  } catch (error) {\n    console.error('Lettura fallita:', error);\n    return fallback;\n  }\n}`;
}

function generateForm(request) {
  const selector = selectorFrom(request, '#my-form');
  const checks = hasAny(normalize(request), ['email', 'mail'])
    ? `\n  const email = String(data.get('email') || '').trim();\n  if (!email || !email.includes('@')) {\n    form.setAttribute('aria-invalid', 'true');\n    return;\n  }`
    : '';
  return `const form = document.querySelector(${jsString(selector)});\n\nif (!form) throw new Error('Form ${selector} non trovato.');\n\nform.addEventListener('submit', (event) => {\n  event.preventDefault();\n  const data = new FormData(form);${checks}\n  console.log('Dati validi:', Object.fromEntries(data));\n});`;
}

function generateArray(request) {
  const text = normalize(request);
  const operation = text.includes('filter') || text.includes('filtr') ? 'filter' : text.includes('reduce') || text.includes('somma') ? 'reduce' : 'map';
  const expression = operation === 'filter'
    ? 'number > 0'
    : operation === 'reduce'
      ? '(total, number) => total + number, 0'
      : 'number * 2';
  const callback = operation === 'reduce' ? expression : `(number) => ${expression}`;
  return `const numbers = [1, 2, 3, 4];\nconst result = numbers.${operation}(${callback});\n\nconsole.log(result);`;
}

function generateEvent(request) {
  const selector = selectorFrom(request);
  const event = eventNameFrom(request);
  return `const element = document.querySelector(${jsString(selector)});\n\nif (element) {\n  element.addEventListener(${jsString(event)}, (event) => {\n    console.log('Evento ricevuto:', event.type, event.target);\n  });\n}`;
}

function generateDebounce() {
  return `function debounce(callback, delay = 300) {\n  let timeoutId;\n\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => callback(...args), delay);\n  };\n}`;
}

function generateModule() {
  return `// utils.js\nexport function greet(name) {\n  return \`Ciao, \${name}!\`;\n}\n\n// app.js\nimport { greet } from './utils.js';\n\nconsole.log(greet('mondo'));`;
}

function generateModal(request) {
  const message = messageFrom(request);
  return `const modal = document.querySelector('#modal');\nconst openButton = document.querySelector('#open-modal');\nconst closeButton = document.querySelector('#close-modal');\n\nif (modal && openButton && closeButton) {\n  modal.querySelector('[data-message]')?.replaceChildren(document.createTextNode(${jsString(message)}));\n  openButton.addEventListener('click', () => modal.showModal?.());\n  closeButton.addEventListener('click', () => modal.close?.());\n}`;
}

function generateSingleFeature(request, text) {
  if (hasAny(text, ['fetch', 'api', 'http', 'richiesta di rete'])) return ['fetch', generateFetch(request)];
  if (hasAny(text, ['localstorage', 'storage', 'memorizza', 'salva'])) return ['localStorage', generateStorage(request)];
  if (hasAny(text, ['form', 'validazione', 'validate', 'modulo'])) return ['form', generateForm(request)];
  if (hasAny(text, ['modal', 'finestra'])) return ['modal', generateModal(request)];
  if (hasAny(text, ['debounce', 'ritardo'])) return ['debounce', generateDebounce()];
  if (hasAny(text, ['array', 'mappa', 'map', 'filtro', 'filter', 'reduce', 'somma'])) return ['array', generateArray(request)];
  if (hasAny(text, ['evento', 'event', 'listener', 'gestore'])) return ['evento', generateEvent(request)];
  if (hasAny(text, ['modulo', 'import', 'export'])) return ['modulo', generateModule()];
  if (hasAny(text, ['bottone', 'button', 'clic', 'click', 'premi'])) return ['bottone', generateButton(request)];
  return null;
}

export function generateJavaScript(request) {
  const original = String(request || '').trim();
  const text = normalize(original);
  if (!text) return `Uso: js <richiesta>. ${HELP}`;

  const generators = [];
  let remaining = text;
  let feature;
  while ((feature = generateSingleFeature(original, remaining))) {
    if (generators.some(([name]) => name === feature[0])) break;
    generators.push(feature);
    remaining = remaining.replace(new RegExp(feature[0], 'i'), '');
    if (generators.length >= 3) break;
  }

  if (!generators.length) {
    return `// Richiesta: ${original}\n// Non ho trovato un pattern locale. ${HELP}\n\nfunction generatedFunction(input) {\n  // TODO: implementa la logica specifica.\n  return input;\n}`;
  }

  const blocks = generators.map(([name, code]) => `// Componente dinamico: ${name}\n${code}`);
  return `// Richiesta: ${original}\n// Componenti generati: ${generators.map(([name]) => name).join(', ')}\n\n${blocks.join('\n\n')}`;
}

export function getJavaScriptGeneratorHelp() {
  return HELP;
}
