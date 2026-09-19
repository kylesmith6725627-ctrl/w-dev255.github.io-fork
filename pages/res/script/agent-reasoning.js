import { createLocalModel } from './agent-local-model.js';

const MAX_TURNS = 12;

function normalize(value) { return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
function includesAny(text, terms) { return terms.some((term) => text.includes(term)); }
function lastMeaningfulTurn(turns) { return [...turns].reverse().find((turn) => turn.intent && turn.intent !== 'unknown'); }

export function createReasoner(state) {
  const model = createLocalModel().catch(() => null);
  const ready = model.then((loaded) => { state.localModel = loaded; return loaded; });

  function remember(input, decision) {
    state.context.turns.push({ input, intent: decision.intent, topic: decision.topic || null, command: decision.command, timestamp: Date.now() });
    if (state.context.turns.length > MAX_TURNS) state.context.turns.shift();
    state.context.lastIntent = decision.intent;
    state.context.lastTopic = decision.topic || state.context.lastTopic;
  }

  function fallback(input, previous) {
    const text = normalize(input);
    const rules = [
      ['help', 'help', ['aiuto', 'help', 'cosa sai fare', 'come funziona']],
      ['time', 'time', ['che ore', 'ora esatta', 'data di oggi', 'che giorno']],
      ['history', 'history', ['cronologia', 'storico', 'comandi precedenti']],
      ['clear', 'clear', ['pulisci', 'cancella schermo', 'svuota schermo']],
      ['goto', 'goto', ['vai ', 'apri ', 'portami ', 'naviga ', 'mostra ']],
      ['html', 'html', ['html', 'pagina web', 'pagina web', 'landing page', 'markup', 'struttura html', 'form html', 'genera una pagina']],
      ['js', 'js', ['javascript', 'genera codice', 'scrivi codice', 'crea codice', 'programma']],
      ['echo', 'echo', ['ripeti ', 'di ', 'scrivi ']]
    ];
    const match = rules.map(([intent, command, terms]) => ({ intent, command, score: terms.filter((term) => text.includes(term)).length })).sort((a, b) => b.score - a.score)[0];
    if (!match || !match.score) return previous && includesAny(text, ['continua', 'approfondisci']) ? { command: previous.command, intent: previous.intent, confidence: 0.5, topic: previous.topic, args: [previous.topic] } : { command: null, intent: 'unknown', confidence: 0, topic: text };
    return { command: match.command, intent: match.intent, confidence: 0.55 + match.score * 0.1, topic: input, args: ['js', 'html'].includes(match.command) ? [input] : [] };
  }

  async function interpret(input) {
    await ready;
    const previous = lastMeaningfulTurn(state.context.turns);
    const prediction = state.localModel?.predict(input);
    let decision = prediction && prediction.intent !== 'unknown' ? { command: prediction.intent === 'continue' ? previous?.command : prediction.intent, intent: prediction.intent, confidence: prediction.confidence, topic: prediction.topic, features: prediction.features } : fallback(input, previous);
    if (decision.intent === 'continue' && previous) { decision.command = previous.command; decision.topic = previous.topic || decision.topic; }
    if (['goto'].includes(decision.command)) decision.args = [decision.topic];
    if (['js', 'html'].includes(decision.command)) decision.args = [decision.topic || input];
    if (decision.command === 'echo') decision.args = [String(input).replace(/^(ripeti|di|scrivi)\s*/i, '').trim()];
    if (decision.command) remember(input, decision);
    return decision;
  }

  function contextualize(message, decision) {
    if (!message || !decision || decision.intent === 'unknown') return message;
    const labels = { help: 'Posso aiutarti con:', time: 'Ecco data e ora locali:', history: 'Questa è la cronologia della sessione:', js: `Generazione locale (confidenza ${(decision.confidence * 100).toFixed(0)}%):`, html: `Pagina HTML generata (confidenza ${(decision.confidence * 100).toFixed(0)}%):` };
    const label = labels[decision.intent];
    return label && !String(message).startsWith(label) ? `${label}\n${message}` : message;
  }

  return { interpret, contextualize, ready };
}
