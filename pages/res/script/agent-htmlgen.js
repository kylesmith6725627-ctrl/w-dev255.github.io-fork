const HELP = 'Generazione HTML: html <richiesta>. Deduce sezioni dal decision tree e produce pagine semantiche con script inline pronti.';

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

function formMarkup(request) {
  const id = selector(request, '#contact-form').slice(1);
  const email = has(normalize(request), ['email', 'mail']);
  return `<section aria-labelledby="form-title">\n  <h2 id="form-title">${escapeHtml(quoted(request, 'Contatti'))}</h2>\n  <form id="${id}" method="post" novalidate>\n    <label for="name">Nome</label>\n    <input id="name" name="name" type="text" autocomplete="name" required>\n${email ? '    <label for="email">Email</label>\n    <input id="email" name="email" type="email" autocomplete="email" required>\n' : ''}    <label for="message">Messaggio</label>\n    <textarea id="message" name="message" rows="5" required></textarea>\n    <button type="submit">Invia</button>\n    <p id="form-status" role="status" aria-live="polite"></p>\n  </form>\n</section>`;
}

function cardMarkup(request) {
  return `<section aria-labelledby="cards-title">\n  <h2 id="cards-title">Contenuti</h2>\n  <div class="cards">\n    <article class="card">\n      <h3>${escapeHtml(quoted(request, 'Titolo card'))}</h3>\n      <p>Descrizione del contenuto.</p>\n      <a href="#details" class="card-link">Scopri di più</a>\n    </article>\n  </div>\n</section>`;
}

function listMarkup() {
  return `<section aria-labelledby="list-title">\n  <h2 id="list-title">Elenco</h2>\n  <ul id="content-list">\n    <li>Primo elemento</li>\n    <li>Secondo elemento</li>\n    <li>Terzo elemento</li>\n  </ul>\n</section>`;
}

function modalMarkup() {
  return `<section aria-labelledby="details-title">\n  <h2 id="details-title">Dettagli</h2>\n  <button type="button" id="open-dialog" aria-haspopup="dialog" aria-controls="details-dialog">Apri dettagli</button>\n  <dialog id="details-dialog" aria-labelledby="dialog-title">\n    <h3 id="dialog-title">Dettagli</h3>\n    <p>Contenuto della finestra.</p>\n    <form method="dialog"><button type="submit">Chiudi</button></form>\n  </dialog>\n</section>`;
}

function scriptMarkup(request, plan) {
  const text = normalize(request);
  const lines = [
    "  'use strict';",
    '  const request = ' + JSON.stringify(String(request)) + ';',
    '  const plan = ' + JSON.stringify(plan?.steps || []) + ';',
    '  console.info(\'Pagina inizializzata:\', request, plan);'
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
    '  async function loadData(url = \'/api/data\') {',
    '    const response = await fetch(url);',
    "    if (!response.ok) throw new Error(`HTTP ${response.status}`);",
    '    return response.json();',
    '  }',
    '  // Collega loadData() al componente che deve ricevere i dati.'
  );
  if (has(text, ['localstorage', 'storage', 'preferenze', 'salva'])) lines.push(
    "  const STORAGE_KEY = 'generated-page-state';",
    '  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || \'{}\');',
    '  // Usa localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) per persistere lo stato.'
  );
  return `<script>\n${lines.join('\n')}\n</script>`;
}

function pageMarkup(request, plan, sections) {
  const title = escapeHtml(quoted(request, 'Nuova pagina'));
  return `<!doctype html>\n<html lang="it">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta name="description" content="${title}">\n  <title>${title}</title>\n</head>\n<body>\n  <header>\n    <h1>${title}</h1>\n    <p>Pagina generata localmente in base al decision tree.</p>\n  </header>\n  <main id="main-content">\n${sections.map((section) => section.split('\n').map((line) => `    ${line}`).join('\n')).join('\n\n')}\n  </main>\n  ${scriptMarkup(request, plan)}\n</body>\n</html>`;
}

export function generateHTML(request, options = {}) {
  const original = String(request || '').trim();
  if (!original) return `Uso: html <richiesta>. ${HELP}`;
  const text = normalize(original);
  const plan = options.plan || { intent: 'html', steps: [] };
  const sections = [];
  const add = (section) => { if (!sections.includes(section)) sections.push(section); };

  if (has(text, ['form', 'modulo', 'contatto', 'login', 'registrazione']) || plan.intent === 'form') add(formMarkup(original));
  if (has(text, ['card', 'scheda', 'prodotto', 'landing'])) add(cardMarkup(original));
  if (has(text, ['lista', 'elenco', 'list', 'menu'])) add(listMarkup());
  if (has(text, ['modal', 'dialog', 'finestra'])) add(modalMarkup());
  if (!sections.length) add(`<section><h2>Contenuto</h2><p>${escapeHtml(original)}</p></section>`);

  return `<!-- Richiesta: ${escapeHtml(original)} -->\n<!-- Generazione HTML locale; sezioni e script dedotti dal decision tree. -->\n${pageMarkup(original, plan, sections)}`;
}

export function getHTMLGeneratorHelp() { return HELP; }
