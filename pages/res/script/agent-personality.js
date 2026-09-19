const DEFAULT_PROFILE = {
  style: 'adaptive',
  detail: 'standard',
  tone: 'neutral',
  pace: 'balanced',
  confidence: 0
};

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s?!]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function count(text, terms) { return terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0); }

/**
 * Infers communication preferences, not a psychological diagnosis or sensitive
 * personality trait. It uses only the current request and recent local turns.
 */
export function inferCommunicationProfile(input, turns = [], previous = null) {
  const recent = turns.slice(-6).map((turn) => turn.input || '').join(' ');
  const text = normalize(`${recent} ${input}`);
  if (!text.trim()) return previous || { ...DEFAULT_PROFILE };

  const concise = count(text, ['breve', 'sintesi', 'sintetico', 'solo codice', 'quick', 'short', 'tl dr', 'diretto']);
  const detailed = count(text, ['dettagliato', 'approfondisci', 'spiega', 'passo passo', 'perche', 'why', 'explain', 'dettagli']);
  const technical = count(text, ['tecnico', 'javascript', 'html', 'api', 'funzione', 'codice', 'implementa', 'debug']);
  const friendly = count(text, ['ciao', 'grazie', 'per favore', 'aiutami', 'hello', 'please', 'thanks']);
  const creative = count(text, ['creativo', 'originale', 'retro', 'colorato', 'design', 'creative', 'idea']);
  const formal = count(text, ['professionale', 'formale', 'specifica', 'requisiti', 'documentazione', 'professional']);
  const urgent = count(text, ['subito', 'urgente', 'ora', 'asap', 'quickly', 'immediatamente']);

  const detail = detailed > concise ? 'detailed' : concise > detailed ? 'concise' : previous?.detail || 'standard';
  const style = creative > formal && creative > technical ? 'creative' : formal > creative ? 'professional' : technical > 0 ? 'technical' : previous?.style || 'adaptive';
  const tone = friendly > formal ? 'friendly' : formal > 0 ? 'professional' : previous?.tone || 'neutral';
  const pace = urgent > 0 || concise > detailed ? 'fast' : detailed > concise ? 'guided' : previous?.pace || 'balanced';
  const signals = concise + detailed + technical + friendly + creative + formal + urgent;
  const confidence = Math.min(0.95, signals ? 0.25 + signals * 0.08 : (previous?.confidence || 0));
  return { style, detail, tone, pace, confidence: Number(confidence.toFixed(2)), inferred: true };
}

export function personalize(message, profile = DEFAULT_PROFILE, language = 'it') {
  const text = String(message || '');
  if (!text || !profile || profile.detail === 'standard' && profile.tone === 'neutral') return text;
  if (profile.detail === 'concise' && text.length > 700) return `${text.slice(0, 697).trimEnd()}...`;
  if (profile.tone === 'friendly' && language === 'it' && !/^(ciao|ottimo|ecco|nota)/i.test(text)) return `Ecco il risultato:\n${text}`;
  if (profile.tone === 'friendly' && language !== 'it' && !/^(hello|great|here)/i.test(text)) return `Here is the result:\n${text}`;
  return text;
}

export { DEFAULT_PROFILE };