import { generateHTML } from './agent-htmlgen.js';

const TEMPLATE_RULES = [
  { name: 'educational-retro', terms: ['didattica', 'educativo', 'codice c', 'esempi di codice', 'retro', 'terminal'] },
  { name: 'technical-notes', terms: ['elettrotecnica', 'tecnica', 'formula', 'circuito', 'tensione', 'corrente', 'resistenza'] },
  { name: 'resource-index', terms: ['strumenti', 'tools', 'file', 'collegamenti', 'risorse', 'link'] },
  { name: 'goals-table', terms: ['obiettivi', 'goals', 'pianificazione', 'da completare', 'attivita'] },
  { name: 'audio-page', terms: ['musica', 'music', 'audio', 'player', 'playlist'] }
];

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function has(text, terms) { return terms.some((term) => text.includes(term)); }

export function selectTemplate(request, plan = {}) {
  const explicit = String(plan.template || plan.templateName || '').trim().toLowerCase();
  if (TEMPLATE_RULES.some((rule) => rule.name === explicit)) return explicit;
  const text = normalize(`${request} ${(plan.steps || []).map((step) => step.value || '').join(' ')}`);
  return TEMPLATE_RULES.find((rule) => has(text, rule.terms))?.name || 'default';
}

function templateSection(template, request) {
  const title = escapeHtml(request || 'Pagina generata');
  const sections = {
    'educational-retro': `<section class="template-panel educational-panel" data-template="educational-retro"><h2>Appunti ed esempi</h2><p>Questa pagina usa il modello didattico retro per organizzare spiegazioni, sezioni riutilizzabili e blocchi di codice.</p><pre><code>// aggiungi qui il tuo esempio</code></pre></section>`,
    'technical-notes': `<section class="template-panel technical-panel" data-template="technical-notes"><h2>Note tecniche</h2><p>Definizioni, formule e relazioni possono essere raccolte in sezioni tecniche leggibili.</p><dl><dt>Argomento</dt><dd>${title}</dd></dl></section>`,
    'resource-index': `<section class="template-panel resource-panel" data-template="resource-index"><h2>Risorse</h2><table><thead><tr><th>Nome</th><th>Descrizione</th></tr></thead><tbody><tr><td>${title}</td><td>Risorsa da configurare</td></tr></tbody></table></section>`,
    'goals-table': `<section class="template-panel goals-panel" data-template="goals-table"><h2>Obiettivi</h2><table><thead><tr><th>Obiettivo</th><th>Stato</th></tr></thead><tbody><tr><td>${title}</td><td>Da completare</td></tr></tbody></table></section>`,
    'audio-page': `<section class="template-panel audio-panel" data-template="audio-page"><h2>Player</h2><audio controls preload="metadata" aria-label="Player audio generato"></audio><p>Inserisci una sorgente audio per completare il player.</p></section>`
  };
  return sections[template] || '';
}

function templateStyle(template) {
  const palettes = {
    'educational-retro': 'background:#101010;color:#d7ffd7;font-family:monospace;border-color:#3cff7a;',
    'technical-notes': 'background:#10202a;color:#e7f8ff;border-color:#55c7e8;',
    'resource-index': 'background:#17131f;color:#f4e8ff;border-color:#c58cff;',
    'goals-table': 'background:#182016;color:#efffdc;border-color:#a8d65a;',
    'audio-page': 'background:#20151b;color:#ffe8f0;border-color:#ff87ad;'
  };
  return palettes[template] || '';
}

export function renderHTMLWithTemplate(request, plan = {}) {
  const template = selectTemplate(request, plan);
  const resolvedPlan = { ...plan, template, templateSource: 'curated-html-dataset' };
  let output = generateHTML(request, { plan: resolvedPlan });
  const section = templateSection(template, request);
  if (section && output.includes('</main>')) output = output.replace('</main>', `${section}\n  </main>`);
  const style = templateStyle(template);
  if (style) output = output.replace('<body data-agent-page>', `<body data-agent-page data-template="${template}"><style>body[data-template="${template}"] .template-panel{border:1px solid;border-radius:.75rem;padding:1rem;${style}}</style>`);
  return output.replace('</head>', `<meta name="agent-template" content="${template}">\n</head>`);
}
