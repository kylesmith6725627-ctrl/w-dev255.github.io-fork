const DEFAULT_MAX_ATTEMPTS = 3;

function repairRequest(request, result, attempt) {
  const issues = result.issues.join('; ');
  return `${request}\n\n[RETRY ${attempt}] Rigenera soltanto un output ${result.type} completo e valido. Correggi questi problemi: ${issues}. Mantieni il contenuto richiesto, non aggiungere spiegazioni e rispetta il formato ${result.type}.`;
}

export function createOutputPipeline({ validator, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {}) {
  if (!validator) throw new Error('Output validator richiesto');
  const limit = Math.max(1, Math.min(8, Number(maxAttempts) || DEFAULT_MAX_ATTEMPTS));

  async function run({ request, type = 'js', generate }) {
    if (typeof generate !== 'function') throw new Error('Generatore richiesto');
    let currentRequest = String(request || '').trim();
    let lastResult = '';
    let lastValidation = null;

    for (let attempt = 1; attempt <= limit; attempt += 1) {
      lastResult = String(await generate(currentRequest) || '');
      lastValidation = validator.validate(lastResult, request, type);
      if (lastValidation.accepted) {
        return { accepted: true, output: lastResult, validation: lastValidation, attempts: attempt };
      }
      if (attempt < limit) currentRequest = repairRequest(request, lastValidation, attempt);
    }

    return {
      accepted: false,
      output: '',
      validation: lastValidation,
      attempts: limit,
      message: `${validator.rejectMessage(lastValidation)}\nTentativi eseguiti: ${limit}.`
    };
  }

  return { run, maxAttempts: limit };
}
