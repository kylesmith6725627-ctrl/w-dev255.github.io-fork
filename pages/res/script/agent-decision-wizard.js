const STEPS = [
  { key: 'goal', prompt: 'Wizard 1/4 — Qual è l’obiettivo principale della richiesta?' },
  { key: 'inputs', prompt: 'Wizard 2/4 — Quali input, dati o elementi deve usare?' },
  { key: 'output', prompt: 'Wizard 3/4 — Quale output vuoi ottenere e in quale formato?' },
  { key: 'constraints', prompt: 'Wizard 4/4 — Ci sono vincoli, tecnologie o requisiti (accessibilità, API, storage)? Scrivi “nessuno” se non ci sono.' }
];

function clean(value) { return String(value || '').trim(); }
function codeIntent(decision) { return ['js', 'html', 'generate-js', 'generate-html'].includes(decision?.command || decision?.intent); }
function explicitEnough(input) {
  const text = clean(input).toLowerCase();
  return text.split(/\s+/).filter(Boolean).length >= 8
    && /\b(form|pagina|page|funzione|function|fetch|api|array|modal|dashboard|validazione|validation|componente|component)\b/.test(text);
}

/**
 * Local wizard for turning an underspecified NLP request into a deterministic
 * decision-tree plan. It does not call a remote model and keeps no secrets.
 */
export function createDecisionWizard() {
  let session = null;

  function start(request, decision = {}) {
    if (!codeIntent(decision) || explicitEnough(request)) return null;
    session = { request: clean(request), decision, answers: {}, step: 0 };
    return { active: true, question: `Posso costruire un piano migliore.\n${STEPS[0].prompt}` };
  }

  function answer(value) {
    if (!session) return { active: false };
    const answerText = clean(value);
    if (!answerText) return { active: true, question: STEPS[session.step].prompt };
    if (/^(cancel|cancella|annulla|esci|quit)$/i.test(answerText)) {
      session = null;
      return { active: false, cancelled: true, message: 'Wizard annullato.' };
    }
    session.answers[STEPS[session.step].key] = answerText;
    session.step += 1;
    if (session.step < STEPS.length) return { active: true, question: STEPS[session.step].prompt };

    const plan = {
      intent: session.decision.intent || session.decision.command,
      category: session.decision.category || session.decision.intent,
      steps: [
        { name: 'goal', value: session.answers.goal },
        { name: 'inputs', value: session.answers.inputs },
        { name: 'output', value: session.answers.output },
        { name: 'constraints', value: session.answers.constraints }
      ],
      confidence: 0.95
    };
    const request = [session.request, `Obiettivo: ${session.answers.goal}`, `Input: ${session.answers.inputs}`, `Output: ${session.answers.output}`, `Vincoli: ${session.answers.constraints}`].join('. ');
    const result = { active: false, complete: true, request, plan, decision: { ...session.decision, topic: request, confidence: plan.confidence } };
    session = null;
    return result;
  }

  function predict(input, base = {}) {
    return { ...base, intent: base.intent || base.category || 'html', steps: base.steps || [], source: input };
  }

  return { start, answer, predict, isActive: () => Boolean(session) };
}