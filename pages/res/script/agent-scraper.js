const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 8_000;
const MAX_ITEMS = 8;

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sectionText(section) {
  const heading = clean(section.querySelector('h1,h2,h3,h4,h5,h6')?.textContent);
  const paragraphs = [...section.querySelectorAll('p,li')]
    .map((item) => clean(item.textContent))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
  return { heading, paragraphs };
}

function formatDocument(document, url, request) {
  const title = clean(document.querySelector('title')?.textContent) || url;
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .map((heading) => clean(heading.textContent))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
  const sections = [...document.querySelectorAll('main section, article, main')]
    .map(sectionText)
    .filter(({ paragraphs }) => paragraphs.length)
    .slice(0, MAX_ITEMS);
  const links = [...document.querySelectorAll('a[href]')]
    .map((link) => ({ label: clean(link.textContent), href: link.href }))
    .filter(({ label }) => label)
    .slice(0, MAX_ITEMS);

  const lines = [
    `Risultati scraping: ${title}`,
    `URL: ${url}`,
    request ? `Richiesta: ${request}` : '',
    '',
    '1. Struttura',
    headings.length ? headings.map((heading, index) => `   ${index + 1}. ${heading}`).join('\n') : '   Nessun titolo trovato.',
    '',
    '2. Contenuto rilevante',
  ];

  if (sections.length) {
    sections.forEach((section, index) => {
      lines.push(`   ${index + 1}. ${section.heading || 'Sezione senza titolo'}`);
      section.paragraphs.forEach((paragraph) => lines.push(`      - ${paragraph}`));
    });
  } else {
    const text = clean(document.body?.textContent).slice(0, 4_000);
    lines.push(text ? `   - ${text}` : '   Nessun contenuto testuale trovato.');
  }

  if (links.length) {
    lines.push('', '3. Link principali');
    links.forEach((link, index) => lines.push(`   ${index + 1}. ${link.label} — ${link.href}`));
  }

  return lines.filter((line, index) => line || lines[index - 1] !== '').join('\n');
}

export async function scrape(args = []) {
  const input = String(args.join(' ')).trim();
  const urlMatch = input.match(/https?:\/\/[^\s"'<>]+/i);
  if (!urlMatch) return 'Uso: scrape <URL> [richiesta]. Sono supportati solo URL http(s).';

  const url = urlMatch[0].replace(/[),.;]+$/, '');
  const request = input.slice(urlMatch.index + urlMatch[0].length).trim();
  let parsed;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocollo non supportato');
  } catch (_) {
    return 'URL non valido. Usa un indirizzo http(s) completo.';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(parsed.href, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml' },
      credentials: 'omit',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) {
      return `La risorsa non è una pagina HTML (${type || 'tipo sconosciuto'}).`;
    }
    const body = await response.text();
    if (new Blob([body]).size > MAX_BYTES) return 'Pagina troppo grande: limite locale di 1 MB.';
    const document = new DOMParser().parseFromString(body, 'text/html');
    return formatDocument(document, parsed.href, request);
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timeout' : error.message;
    return `Scraping non riuscito: ${reason}. Il sito potrebbe bloccare CORS; usa un proxy backend autorizzato, senza aggirare i controlli del sito.`;
  } finally {
    clearTimeout(timeout);
  }
}

export function getScrapingHelp() {
  return 'Scraping: scrape <URL> [richiesta]. Analizza una pagina HTML accessibile via CORS e restituisce struttura, contenuto e link in forma gerarchica.';
}
