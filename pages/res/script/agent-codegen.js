const HELP = 'Richieste supportate: bottone, fetch, localStorage, debounce, array, evento, modulo';

const templates = [
  {
    keywords: ['bottone', 'button'],
    generate: () => `const button = document.querySelector('#my-button');

button.addEventListener('click', () => {
  document.querySelector('#output').textContent = 'Bottone premuto!';
});`
  },
  {
    keywords: ['fetch', 'api', 'http'],
    generate: () => `async function loadData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);
  return response.json();
}

loadData('/data.json')
  .then((data) => console.log(data))
  .catch((error) => console.error('Caricamento fallito:', error));`
  },
  {
    keywords: ['localstorage', 'storage', 'salva'],
    generate: () => `function saveValue(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readValue(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch (_) {
    return fallback;
  }
}`
  },
  {
    keywords: ['debounce', 'ritardo'],
    generate: () => `function debounce(callback, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}`
  },
  {
    keywords: ['array', 'mappa', 'map'],
    generate: () => `const numbers = [1, 2, 3, 4];
const doubled = numbers.map((number) => number * 2);

console.log(doubled);`
  },
  {
    keywords: ['evento', 'event', 'listener'],
    generate: () => `document.addEventListener('DOMContentLoaded', () => {
  const element = document.querySelector('#target');
  if (!element) return;

  element.addEventListener('click', (event) => {
    console.log('Evento ricevuto:', event.type, event.target);
  });
});`
  },
  {
    keywords: ['modulo', 'import', 'export'],
    generate: () => `// utils.js
export function greet(name) {
  return \`Ciao, \${name}!\`;
}

// app.js
import { greet } from './utils.js';
console.log(greet('mondo'));`
  }
];

function normalize(text) {
  return String(text || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function generateJavaScript(request) {
  const normalized = normalize(request.trim());
  if (!normalized) return `Uso: js <richiesta>. ${HELP}`;

  // Sceglie il modello con più corrispondenze, non semplicemente il primo.
  const ranked = templates.map((template) => ({
    template,
    score: template.keywords.reduce((score, keyword) => (
      score + (normalized.includes(keyword) ? 1 : 0)
    ), 0)
  })).sort((left, right) => right.score - left.score);

  if (ranked[0].score > 0) return ranked[0].template.generate();

  return `// Richiesta: ${request.trim()}
// Nessun modello locale specifico trovato.
// ${HELP}
function generatedFunction() {
  // Completa qui la logica richiesta.
}`;
}

export function getJavaScriptGeneratorHelp() {
  return HELP;
}
