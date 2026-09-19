const HELP = 'Generazione HTML: html <richiesta>. HTML ospita i contenuti; JavaScript costruisce la struttura, la logica e lo stile reattivo.';

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9#._/:?&=\s-]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function quoted(request, fallback) {
  return String(request).match(/["“”']([^"“”']+)["“”']/)?.[1] || fallback;
}

function selector(request, fallback) {
  return String(request).match(/#[a-zA-Z][\w-]*/)?.[0] || fallback;
}

function has(text, terms) { return terms.some((term) => text.includes(term)); }

function section(title, content, id) {
  return `<section id="${id}" class="page-section" data-section="${id}" aria-labelledby="${id}-title">\n  <h2 id="${id}-title">${title}</h2>\n${content}\n</section>`;
}

function formMarkup(request) {
  const id = selector(request, '#contact-form').slice(1);
  const email = has(normalize(request), ['email', 'mail']);
  const fields = [
    '    <label for="name">Nome</label>',
    '    <input id="name" name="name" type="text" autocomplete="name" required>'
  ];
  if (email) fields.push('    <label for="email">Email</label>', '    <input id="email" name="email" type="email" autocomplete="email" required>');
  fields.push('    <label for="message">Messaggio</label>', '    <textarea id="message" name="message" rows="5" required></textarea>');
  return section(escapeHtml(quoted(request, 'Contatti')), `  <form id="${id}" method="post" novalidate>\n${fields.join('\n')}\n    <button type="submit">Invia</button>\n    <p id="form-status" role="status" aria-live="polite"></p>\n  </form>`, 'contact');
}

function cardMarkup(request) {
  return section('Contenuti', `  <div class="cards" data-card-list>\n    <article class="card">\n      <h3>${escapeHtml(quoted(request, 'Titolo card'))}</h3>\n      <p>Descrizione del contenuto.</p>\n      <a href="#details" class="card-link">Scopri di più</a>\n    </article>\n  </div>`, 'cards');
}

function listMarkup() {
  return section('Elenco', `  <ul id="content-list">\n    <li>Primo elemento</li>\n    <li>Secondo elemento</li>\n    <li>Terzo elemento</li>\n  </ul>`, 'list');
}

function modalMarkup() {
  return section('Dettagli', `  <button type="button" id="open-dialog" aria-haspopup="dialog" aria-controls="details-dialog">Apri dettagli</button>\n  <dialog id="details-dialog" aria-labelledby="dialog-title">\n    <h3 id="dialog-title">Dettagli</h3>\n    <p>Contenuto della finestra.</p>\n    <form method="dialog"><button type="submit">Chiudi</button></form>\n  </dialog>`, 'details');
}

function buildScript(request, plan) {
  const text = normalize(request);
  const lines = [
    "  'use strict';",
    `  const pageRequest = ${JSON.stringify(String(request))};`,
    `  const decisionPlan = ${JSON.stringify(plan?.steps || [])};`,
    "  const root = document.querySelector('[data-agent-page]');",
    "  const setTheme = (dark) => root?.classList.toggle('theme-dark', dark);",
    "  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)');",
    "  setTheme(Boolean(prefersDark?.matches));",
    "  prefersDark?.addEventListener?.('change', (event) => setTheme(event.matches));",
    "  console.info('Pagina generata:', pageRequest, decisionPlan);"
  ];
  if (has(text, ['form', 'modulo', 'contatto', 'login', 'registrazione'])) lines.push(
    "  const form = document.querySelector('form');",
    "  form?.addEventListener('submit', (event) => {",
    "    event.preventDefault();",
    "    const status = document.querySelector('#form-status');",
    "    if (!form.checkValidity()) { form.reportValidity(); return; }",
    "    if (status) status.textContent = 'Dati validi: invio pronto.';",
    '  });'
  );
  if (has(text, ['modal', 'dialog', 'finestra'])) lines.push(
    "  const dialog = document.querySelector('#details-dialog');",
    "  document.querySelector('#open-dialog')?.addEventListener('click', () => dialog?.showModal());"
  );
  if (has(text, ['fetch', 'api', 'http', 'richiesta'])) lines.push(
    "  async function loadData(url = '/api/data') {",
    '    const response = await fetch(url);',
    "    if (!response.ok) throw new Error(`HTTP ${response.status}`);",
    '    return response.json();',
    '  }',
    '  window.loadData = loadData;'
  );
  if (has(text, ['localstorage', 'storage', 'preferenze', 'salva'])) lines.push(
    "  const STORAGE_KEY = 'generated-page-state';",
    "  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');",
    "  window.savePageState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));",
    '  console.debug(\'Stato ripristinato:\', savedState);'
  );
  return `<script>\n${lines.join('\n')}\n</script>`;
}

function pageMarkup(request, plan, sections) {
  const title = escapeHtml(quoted(request, 'Nuova pagina'));
  const style = `<style>\n    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }\n    body { margin: 0; background: Canvas; color: CanvasText; transition: background .2s, color .2s; }\n    body.theme-dark { background: #111827; color: #f9fafb; }\n    [data-agent-page] { max-width: 70rem; margin: auto; padding: clamp(1rem, 4vw, 3rem); }\n    .page-section { margin-block: 2rem; }\n    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; }\n    .card { padding: 1rem; border: 1px solid color-mix(in srgb, CanvasText 25%, transparent); border-radius: .75rem; }\n    form { display: grid; gap: .6rem; max-width: 34rem; }\n    input, textarea, button { font: inherit; padding: .6rem; }\n  </style>`;
  return `<!doctype html>\n<html lang="it">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta name="description" content="${title}">\n  <title>${title}</title>\n${style}\n</head>\n<body data-agent-page>\n  <header>\n    <h1>${title}</h1>\n    <p>Contenuti HTML ospitati nel documento; struttura e comportamento gestiti dinamicamente da JavaScript.</p>\n  </header>\n  <main id="main-content">\n${sections.map((item) => item.split('\n').map((line) => `    ${line}`).join('\n')).join('\n\n')}\n  </main>\n  <script type="application/json" id="agent-page-data">${JSON.stringify({ request, plan })}</script>\n  ${buildScript(request, plan)}\n</body>\n</html>`;
}

export function generateHTML(request, options = {}) {
  const original = String(request || '').trim();
  if (!original) return `Uso: html <richiesta>. ${HELP}`;
  const text = normalize(original);
  const plan = options.plan || { intent: 'html', steps: [] };
  const sections = [];
  const add = (value) => { if (!sections.includes(value)) sections.push(value); };
  if (has(text, ['form', 'modulo', 'contatto', 'login', 'registrazione']) || plan.intent === 'form') add(formMarkup(original));
  if (has(text, ['card', 'scheda', 'prodotto', 'landing'])) add(cardMarkup(original));
  if (has(text, ['lista', 'elenco', 'list', 'menu'])) add(listMarkup());
  if (has(text, ['modal', 'dialog', 'finestra'])) add(modalMarkup());
  if (!sections.length) add(section('Contenuto', `  <p>${escapeHtml(original)}</p>`, 'content'));
  return `<!-- Richiesta: ${escapeHtml(original)} -->\n<!-- HTML contiene i contenuti; JavaScript gestisce struttura, logica e reattività. -->\n${pageMarkup(original, plan, sections)}`;
}

export function getHTMLGeneratorHelp() { return HELP; }
