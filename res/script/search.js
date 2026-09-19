import { interpretNaturalLanguage } from '../../pages/res/script/agent-nlp.js';

const pages = {
  c: 'pages/c.html', tools: 'pages/tools.html', music: 'pages/music.html', goals: 'pages/goals.html',
  elettrotecnica: 'pages/elettrotecnica.html', quiz: 'pages/quiz_elettrotecnica.html',
  systemsandnetwork: 'pages/systems_and_network.html', test: 'pages/test.html',
  agent: 'pages/agent.html', query: 'pages/valid_query.html', home: 'index.html'
};
const aliases = {
  'linguaggio c': 'c', strumenti: 'tools', tool: 'tools', musica: 'music',
  obiettivi: 'goals', goal: 'goals', elettricita: 'elettrotecnica',
  'sistemi e reti': 'systemsandnetwork', agente: 'agent', assistant: 'agent',
  casa: 'home', homepage: 'home'
};
const normalize = (value) => String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const resolveKey = (value) => aliases[normalize(value)] || normalize(value).replace(/\s+/g, '');
const resolveDestination = (query) => {
  const direct = pages[resolveKey(query)];
  if (direct) return direct;
  const decision = interpretNaturalLanguage(query);
  return decision?.command === 'goto' ? (pages[resolveKey(decision.args?.[0])] || 'pages/404.html') : 'pages/404.html';
};
const form = document.querySelector('.retro_box');
const input = document.querySelector('#site-search');
if (form && input) form.addEventListener('submit', (event) => {
  event.preventDefault();
  window.location.assign(resolveDestination(input.value));
});
export { resolveDestination };
