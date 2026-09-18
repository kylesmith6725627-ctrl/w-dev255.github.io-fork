const HELP = 'Generazione HTML: html <richiesta>. Crea markup semantico per pagine, form, card, liste, tabelle, modal e layout accessibili.';

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

function documentBlock(request) {
  const title = escapeHtml(quoted(request, 'Nuova pagina'));
  return `<!doctype html>\n<html lang="it">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta name="description" content="${title}">\n  <title>${title}</title>\n</head>\n<body>\n  <header>\n    <h1>${title}</h1>\n  </header>\n  <main id="main-content">\n    <!-- Contenuto generato qui -->\n  </main>\n</body>\n</html>`;
}

function formBlock(request) {
  const id = selector(request, '#contact-form');
  const email = has(normalize(request), ['email', 'mail']);
  return `<form id="${id.slice(1)}" method="post" novalidate>\n  <fieldset>\n    <legend>${escapeHtml(quoted(request, 'Contatti'))}</legend>\n    <label for="name">Nome</label>\n    <input id="name" name="name" type="text" autocomplete="name" required>\n${email ? '    <label for="email">Email</label>\n    <input id="email" name="email" type="email" autocomplete="email" required>\n' : ''}    <label for="message">Messaggio</label>\n    <textarea id="message" name="message" rows="5" required></textarea>\n    <button type="submit">Invia</button>\n  </fieldset>\n</form>`;
}

function cardBlock(request) {
  const title = escapeHtml(quoted(request, 'Titolo card'));
  return `<article class="card">\n  <h2>${title}</h2>\n  <p>Descrizione del contenuto.</p>\n  <a href="#details" class="card-link">Scopri di più</a>\n</article>`;
}

function listBlock() {
  return `<section aria-labelledby="list-title">\n  <h2 id="list-title">Elenco</h2>\n  <ul>\n    <li>Primo elemento</li>\n    <li>Secondo elemento</li>\n    <li>Terzo elemento</li>\n  </ul>\n</section>`;
}

function modalBlock() {
  return `<button type="button" aria-haspopup="dialog" aria-controls="details-dialog">Apri dettagli</button>\n<dialog id="details-dialog" aria-labelledby="dialog-title">\n  <h2 id="dialog-title">Dettagli</h2>\n  <p>Contenuto della finestra.</p>\n  <form method="dialog"><button type="submit">Chiudi</button></form>\n</dialog>`;
}

export function generateHTML(request) {
  const original = String(request || '').trim();
  if (!original) return `Uso: html <richiesta>. ${HELP}`;
  const text = normalize(original);
  const blocks = [];
  const add = (name, code) => blocks.push(`<!-- ===== ${name} ===== -->\n${code}`);

  if (has(text, ['pagina', 'page', 'document', 'html completo', 'landing'])) add('documento HTML', documentBlock(original));
  if (has(text, ['form', 'modulo', 'contatto', 'login', 'registrazione'])) add('form accessibile', formBlock(original));
  if (has(text, ['card', 'scheda', 'prodotto'])) add('card semantica', cardBlock(original));
  if (has(text, ['lista', 'elenco', 'list', 'menu'])) add('lista', listBlock());
  if (has(text, ['modal', 'dialog', 'finestra'])) add('dialog accessibile', modalBlock());
  if (!blocks.length) add('documento HTML', documentBlock(original));

  return `<!-- Richiesta: ${escapeHtml(original)} -->\n<!-- Generazione HTML locale con markup semantico e accessibile. -->\n\n${blocks.join('\n\n')}`;
}

export function getHTMLGeneratorHelp() { return HELP; }
