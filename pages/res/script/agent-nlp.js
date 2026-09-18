const STOP_WORDS = new Set([
  'a', 'ad', 'al', 'alla', 'che', 'con', 'di', 'e', 'il', 'in', 'la', 'le',
  'lo', 'mi', 'non', 'per', 'puoi', 'qual', 'quale', 'sono', 'un', 'una',
  'vorrei', 'del', 'della', 'dei', 'delle', 'gli'
]);

const ACCENTS = { à: 'a', è: 'e', é: 'e', ì: 'i', ò: 'o', ù: 'u' };

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('it-IT')
    .replace(/[àèéìòù]/g, (character) => ACCENTS[character])
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(value) {
  return normalize(value)
    .split(' ')
    .filter((word) => word && !STOP_WORDS.has(word));
}

function hasAny(value, candidates) {
  const normalized = normalize(value);
  return candidates.some((candidate) => normalized.includes(candidate));
}

function destination(value) {
  const normalized = normalize(value);
  if (hasAny(normalized, ['home', 'casa', 'homepage', 'inizio'])) return 'home';
  if (hasAny(normalized, ['agent', 'agente'])) return 'agent';
  if (hasAny(normalized, ['tool', 'strumenti'])) return 'tools';
  if (hasAny(normalized, ['quiz', 'elettrotecnica'])) return 'quiz';
  return null;
}

function scoreIntent(value, intent) {
  return intent.some((term) => normalize(value).includes(term))
    ? intent.reduce((score, term) => score + (normalize(value).includes(term) ? 1 : 0), 0)
    : 0;
}

/**
 * Interpreta richieste brevi in italiano senza rete, API o modelli remoti.
 * Restituisce solo comandi già supportati dall'agente: non esegue testo libero.
 */
export function interpretNaturalLanguage(input) {
  const request = String(input || '').trim();
  if (!request) return null;

  const intents = [
    { command: 'help', terms: ['aiuto', 'cosa sai fare', 'comandi', 'come funziona'] },
    { command: 'time', terms: ['che ore', 'ora esatta', 'data di oggi', 'che giorno'] },
    { command: 'history', terms: ['cronologia', 'storico', 'comandi precedenti'] },
    { command: 'clear', terms: ['pulisci', 'cancella schermo', 'svuota schermo', 'clear'] },
    { command: 'echo', terms: ['ripeti', 'di ', 'scrivi '] },
    { command: 'goto', terms: ['vai ', 'apri ', 'portami ', 'naviga ', 'mostra '] },
    { command: 'js', terms: ['genera javascript', 'genera codice', 'scrivi codice', 'crea codice'] }
  ];

  const best = intents
    .map((item) => ({ ...item, score: scoreIntent(request, item.terms) }))
    .sort((left, right) => right.score - left.score)[0];

  if (!best || best.score === 0) return null;
  if (best.command === 'goto') {
    const page = destination(request);
    return page ? { command: 'goto', args: [page] } : null;
  }
  if (best.command === 'echo') {
    return { command: 'echo', args: [request.replace(/^(ripeti|di|scrivi)\s*/i, '').trim()] };
  }
  if (best.command === 'js') {
    const text = request.replace(/^(genera javascript|genera codice|scrivi codice|crea codice)\s*/i, '').trim();
    return { command: 'js', args: words(text).length ? [text] : [] };
  }
  return { command: best.command, args: [] };
}

export function getNaturalLanguageHelp() {
  return 'NLP locale: prova “che ore sono”, “vai agli strumenti”, “ripeti ciao”, “genera codice per un bottone” o “aiuto”.';
}
