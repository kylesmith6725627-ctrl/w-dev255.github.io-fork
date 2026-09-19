const QUESTIONS = [
  { key: 'goal', prompt: 'Wizard 1/4 — Qual è l’obiettivo principale della pagina o del codice?' },
  { key: 'inputs', prompt: 'Wizard 2/4 — Quali dati, contenuti o componenti devono essere inclusi?' },
  { key: 'output', prompt: 'Wizard 3/4 — Che tipo di output vuoi ottenere: pagina HTML, componente JS, form, modal, dashboard?' },
  { key: 'constraints', prompt: 'Wizard 4/4 — Ci sono vincoli tecnici o design? Scrivi “nessuno” se non ce ne sono.' }
];

function normalizeText(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCodeIntent(decision = {}) {
  const command = String(decision.command || decision.intent || '').toLowerCase();
  return ['js', 'html', 'generate-js', 'generate-html'].includes(command);
}

function explicitEnough(text) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const hasStructure = /(pagina|page|form|modulo|funzione|function|fetch|api|modal|dashboard|card|button|validazione|validation|componente|component|layout)/.test(normalized);
  return words.length >= 8 && hasStructure;
}

export function createDecisionWizard() {
  let session = null;

  function start(request, decision = {}) {
    const text = normalizeText(request || '');
    if (!text || !isCodeIntent(decision) || explicitEnough(text)) return null;
    session = { request: text, decision, answers: {}, step: 0 };
    return { active: true, question: QUESTIONS[0].prompt };
  }

  function answer(value) {
    if (!session) return { active: false };
    const reply = String(value || '').trim();

    if (!reply) return { active: true, question: QUESTIONS[session.step].prompt };
    if (/^(cancel|cancella|annulla|esci|quit)$/i.test(reply)) {
      session = null;
      return { active: false, cancelled: true, message: 'Wizard annullato.' };
    }

    session.answers[QUESTIONS[session.step].key] = reply;
    session.step += 1;

    if (session.step < QUESTIONS.length) {
      return { active: true, question: QUESTIONS[session.step].prompt };
    }

    const plan = {
      intent: session.decision.intent || session.decision.command || 'js',
      category: session.decision.category || session.decision.intent || session.decision.command || 'js',
      confidence: 0.96,
      steps: [
        { name: 'goal', value: session.answers.goal },
        { name: 'inputs', value: session.answers.inputs },
        { name: 'output', value: session.answers.output },
        { name: 'constraints', value: session.answers.constraints }
      ]
    };

    const requestText = [
      session.request,
      `Obiettivo: ${session.answers.goal}`,
      `Input: ${session.answers.inputs}`,
      `Output: ${session.answers.output}`,
      `Vincoli: ${session.answers.constraints}`
    ].join('. ');

    const result = {
      active: false,
      complete: true,
      request: requestText,
      plan,
      decision: { ...session.decision, topic: requestText, confidence: plan.confidence }
    };

    session = null;
    return result;
  }

  function predict(input, base = {}) {
    const intent = base.intent || base.category || 'html';
    const source = String(input || '').trim();
    return {
      ...base,
      intent,
      category: base.category || intent,
      steps: Array.isArray(base.steps) && base.steps.length ? base.steps : [{ name: 'goal', value: source || 'generazione' }],
      confidence: Number(base.confidence) || 0.8,
      source
    };
  }

  return { start, answer, predict, isActive: () => Boolean(session) };
}
