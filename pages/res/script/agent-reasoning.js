const MAX_TURNS = 12;

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function extractTopic(input) {
  const value = String(input || '').trim();
  const match = value.match(/(?:per|su|riguardo a|di|del|della|sul|sulla)\s+(.+)$/i);
  return match ? match[1].trim() : value;
}

function lastMeaningfulTurn(turns) {
  return [...turns].reverse().find((turn) => turn.intent && turn.intent !== 'unknown');
}

/**
 * Piccolo livello di ragionamento deterministico: conserva contesto locale,
 * risolve riferimenti alla richiesta precedente e produce una decisione
 * spiegabile. Non usa modelli remoti, API o eval di input utente.
 */
export function createReasoner(state) {
  function remember(input, decision) {
    state.context.turns.push({
      input,
      intent: decision.intent,
      topic: decision.topic || null,
      command: decision.command,
      timestamp: Date.now()
    });
    if (state.context.turns.length > MAX_TURNS) state.context.turns.shift();
    state.context.lastIntent = decision.intent;
    state.context.lastTopic = decision.topic || state.context.lastTopic;
  }

  function resolveTopic(input, explicitTopic) {
    if (explicitTopic) return explicitTopic;
    const normalized = normalize(input);
    const previous = lastMeaningfulTurn(state.context.turns);
    const refersToPrevious = includesAny(normalized, [
      'quello', 'quella', 'stessa cosa', 'come prima', 'continua', 'approfondisci',
      'e poi', 'anche questo', 'questo'
    ]);
    return refersToPrevious && previous?.topic ? previous.topic : '';
  }

  function decide(input) {
    const raw = String(input || '').trim();
    const text = normalize(raw);
    if (!text) return { command: null, intent: 'unknown', confidence: 0, topic: '' };

    const previous = lastMeaningfulTurn(state.context.turns);
    const topic = resolveTopic(raw, extractTopic(raw));
    const rules = [
      { intent: 'help', command: 'help', terms: ['aiuto', 'help', 'cosa sai fare', 'come funziona'] },
      { intent: 'time', command: 'time', terms: ['che ore', 'ora esatta', 'data di oggi', 'che giorno'] },
      { intent: 'history', command: 'history', terms: ['cronologia', 'storico', 'comandi precedenti'] },
      { intent: 'clear', command: 'clear', terms: ['pulisci', 'cancella schermo', 'svuota schermo'] },
      { intent: 'goto', command: 'goto', terms: ['vai ', 'apri ', 'portami ', 'naviga ', 'mostra '] },
      { intent: 'js', command: 'js', terms: ['genera codice', 'genera javascript', 'scrivi codice', 'crea codice', 'programma'] },
      { intent: 'echo', command: 'echo', terms: ['ripeti ', 'di ', 'scrivi '] }
    ];

    const scored = rules.map((rule) => ({
      ...rule,
      score: rule.terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0)
    })).sort((a, b) => b.score - a.score);
    const best = scored[0];

    // “continua” e “approfondisci” ereditano l'ultimo intento utile.
    if (best.score === 0 && previous && includesAny(text, ['continua', 'approfondisci', 'ancora', 'spiega meglio'])) {
      return { command: previous.command, intent: previous.intent, confidence: 0.72, topic, inherited: true };
    }
    if (best.score === 0) return { command: null, intent: 'unknown', confidence: 0, topic };

    const confidence = Math.min(0.98, 0.55 + best.score * 0.15);
    if (best.command === 'goto') return { command: 'goto', intent: best.intent, confidence, topic, args: [topic] };
    if (best.command === 'js') return { command: 'js', intent: best.intent, confidence, topic, args: [topic || raw] };
    if (best.command === 'echo') return { command: 'echo', intent: best.intent, confidence, topic, args: [raw.replace(/^(ripeti|di|scrivi)\s*/i, '').trim()] };
    return { command: best.command, intent: best.intent, confidence, topic, args: [] };
  }

  function interpret(input) {
    const decision = decide(input);
    if (decision.command) remember(input, decision);
    return decision;
  }

  function contextualize(message, decision) {
    if (!message || !decision || decision.intent === 'unknown') return message;
    const labels = {
      help: 'Posso aiutarti con:',
      time: 'Ecco data e ora locali:',
      history: 'Questa è la cronologia della sessione:',
      js: decision.topic ? `Ho interpretato la richiesta come codice JavaScript per “${decision.topic}”:` : 'Ho interpretato la richiesta come generazione di codice:',
      goto: 'Navigazione richiesta:',
      echo: 'Come richiesto:'
    };
    const label = labels[decision.intent];
    return label && !String(message).startsWith(label) ? `${label}\n${message}` : message;
  }

  return { interpret, contextualize };
}
