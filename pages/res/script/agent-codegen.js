const HELP = 'Richieste supportate: bottone, fetch/API, localStorage, debounce, array, evento, modulo, form, validazione, modal. Usa js <richiesta>.';

const DEFAULT_SELECTOR = '#my-button';

function normalize(text) {
  return String(text || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9#._/-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function selectorFrom(request, fallback = DEFAULT_SELECTOR) {
  const match = String(request).match(/#[a-zA-Z][\w-]*/);
  return match ? match[0] : fallback;
}

function quotedText(request, fallback) {
  const match = String(request).match(/["'“”]([^"'“”]+)["'“”]/);
  return match ? match[1] : fallback;
}

function jsString(value) {
  return JSON.stringify(String(value));
}

function scoreTemplate(template, normalized) {
  const keywordScore = template.keywords.reduce((score, keyword) => {
    const normalizedKeyword = normalize(keyword);
    return score + (normalized.includes(normalizedKeyword) ? (normalizedKeyword.includes(' ') ? 3 : 1) : 0);
  }, 0);
  const contextScore = template.context?.reduce((score, keyword) => (
    score + (normalized.includes(normalize(keyword)) ? 1 : 0)
  ), 0) || 0;
  return keywordScore + contextScore;
}

const templates = [
  {
    name: 'bottone',
    keywords: ['bottone', 'button'],
    context: ['clic', 'click', 'premi'],
    generate: (request) => {
      const selector = selectorFrom(request);
      const message = quotedText(request, 'Bottone premuto!');
      return `const button = document.querySelector(${jsString(selector)});\n\nif (!button) {\n  throw new Error('Elemento ${selector} non trovato.');\n}\n\nbutton.addEventListener('click', () => {\n  const output = document.querySelector('#output');\n  if (output) output.textContent = ${jsString(message)};\n});`;
    }
  },
  {
    name: 'fetch',
    keywords: ['fetch', 'api', 'http', 'richiesta di rete'],
    context: ['json', 'dati', 'carica', 'caricare'],
    generate: (request) => {
      const url = quotedText(request, '/data.json');
      return `async function loadData(url = ${jsString(url)}) {\n  const response = await fetch(url, {\n    headers: { Accept: 'application/json' }\n  });\n\n  if (!response.ok) {\n    throw new Error(\`HTTP error: \${response.status}\`);\n  }\n\n  return response.json();\n}\n\ntry {\n  const data = await loadData();\n  console.log(data);\n} catch (error) {\n  console.error('Caricamento fallito:', error);\n}`;
    }
  },
  {
    name: 'localStorage',
    keywords: ['localstorage', 'storage', 'salva', 'memorizza'],
    context: ['leggi', 'recupera', 'persistenza'],
    generate: () => `function saveValue(key, value) {\n  try {\n    localStorage.setItem(key, JSON.stringify(value));\n  } catch (error) {\n    console.error('Salvataggio fallito:', error);\n  }\n}\n\nfunction readValue(key, fallback = null) {\n  try {\n    const value = localStorage.getItem(key);\n    return value === null ? fallback : JSON.parse(value);\n  } catch (error) {\n    console.error('Lettura fallita:', error);\n    return fallback;\n  }\n}`
  },
  {
    name: 'debounce',
    keywords: ['debounce', 'ritardo'],
    context: ['input', 'ricerca', 'attesa'],
    generate: () => `function debounce(callback, delay = 300) {\n  let timeoutId;\n\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => callback(...args), delay);\n  };\n}`
  },
  {
    name: 'array',
    keywords: ['array', 'mappa', 'map', 'filtro', 'filter', 'riduci', 'reduce'],
    context: ['elementi', 'lista', 'numeri'],
    generate: () => `const numbers = [1, 2, 3, 4];\nconst doubled = numbers\n  .filter((number) => number > 1)\n  .map((number) => number * 2);\n\nconsole.log(doubled);`
  },
  {
    name: 'evento',
    keywords: ['evento', 'event', 'listener', 'gestore'],
    context: ['click', 'submit', 'input', 'dom'],
    generate: (request) => {
      const eventName = normalize(request).includes('submit') ? 'submit' : 'click';
      const selector = selectorFrom(request, '#target');
      return `const element = document.querySelector(${jsString(selector)});\n\nif (element) {\n  element.addEventListener(${jsString(eventName)}, (event) => {\n    console.log('Evento ricevuto:', event.type, event.target);\n  });\n}`;
    }
  },
  {
    name: 'form',
    keywords: ['form', 'modulo', 'validazione', 'validate', 'validare'],
    context: ['input', 'submit', 'errore', 'email'],
    generate: (request) => {
      const selector = selectorFrom(request, '#my-form');
      return `const form = document.querySelector(${jsString(selector)});\n\nif (!form) {\n  throw new Error('Form ${selector} non trovato.');\n}\n\nform.addEventListener('submit', (event) => {\n  event.preventDefault();\n  const data = new FormData(form);\n  const email = String(data.get('email') || '').trim();\n\n  if (!email || !email.includes('@')) {\n    form.setAttribute('aria-invalid', 'true');\n    console.error('Inserisci un indirizzo email valido.');\n    return;\n  }\n\n  form.removeAttribute('aria-invalid');\n  console.log('Form valido:', Object.fromEntries(data));\n});`;
    }
  },
  {
    name: 'modulo',
    keywords: ['modulo', 'import', 'export'],
    context: ['file', 'esportare', 'importare'],
    generate: () => `// utils.js\nexport function greet(name) {\n  return \`Ciao, \${name}!\`;\n}\n\n// app.js\nimport { greet } from './utils.js';\n\nconsole.log(greet('mondo'));`
  }
];

export function generateJavaScript(request) {
  const original = String(request || '').trim();
  const normalized = normalize(original);
  if (!normalized) return `Uso: js <richiesta>. ${HELP}`;

  const ranked = templates
    .map((template, index) => ({ template, index, score: scoreTemplate(template, normalized) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  if (ranked[0].score > 0) {
    const selected = ranked[0].template;
    return `// Modello: ${selected.name}\n// Richiesta: ${original}\n\n${selected.generate(original)}`;
  }

  return `// Richiesta: ${original}\n// Nessun modello locale specifico trovato.\n// ${HELP}\n\nfunction generatedFunction(input) {\n  // TODO: implementa qui la logica richiesta.\n  return input;\n}`;
}

export function getJavaScriptGeneratorHelp() {
  return HELP;
}
