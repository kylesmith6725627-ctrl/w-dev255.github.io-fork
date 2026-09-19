import { interpretNaturalLanguage } from '../pages/res/script/agent-nlp.js';

const pages = {
  c: 'pages/c.html',
  tools: 'pages/tools.html',
  music: 'pages/music.html',
  goals: 'pages/goals.html',
  elettrotecnica: 'pages/elettrotecnica.html',
  quiz: 'pages/quiz_elettrotecnica.html',
  systemsandnetwork: 'pages/systems_and_network.html',
  test: 'pages/test.html',
  agent: 'pages/agent.html',
  query: 'pages/valid_query.html',
  home: 'index.html'
};

const aliases = {
  c: 'c',
  'linguaggio c': 'c',
  strumenti: 'tools',
  tool: 'tools',
  music: 'music',
  musica: 'music',
  obiettivi: 'goals',
  goal: 'goals',
  elettricita: 'elettrotecnica',
  elettrotecnica: 'elettrotecnica',
  quiz: 'quiz',
  'sistemi e reti': 'systemsandnetwork',
  systemsandnetwork: 'systemsandnetwork',
  test: 'test',
  agente: 'agent',
  assistant: 'agent',
  agent: 'agent',
  query: 'query',
  home: 'home',
  casa: 'home',
  homepage: 'home'
};

const form = document.querySelector('.retro_box');
const input = document.querySelector('#site-search');

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function directDestination(query) {
  const normalized = normalize(query);
  const key = aliases[normalized] || normalized.replace(/\s+/g, '');
  return pages[key] || null;
}

function agentDestination(query) {
  const decision = interpretNaturalLanguage(query);
  if (decision?.command !== 'goto') return null;
  const target = normalize(decision.args?.[0]);
  const key = aliases[target] || target.replace(/\s+/g, '');
  return pages[key] || null;
}

function resolveDestination(query) {
  return directDestination(query) || agentDestination(query) || 'pages/404.html';
}

if (form && input) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.location.assign(resolveDestination(input.value));
  });
}

export { resolveDestination };
