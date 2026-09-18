function normalize(value) {
  return String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9#._/\s?-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectLanguage(input) {
  const text = normalize(input);
  const italian = ['ciao', 'come stai', 'cosa', 'perche', 'puoi', 'vorrei', 'aiutami', 'grazie', 'crea', 'scrivi', 'spiega'];
  const english = ['hello', 'how are you', 'what', 'why', 'can you', 'please', 'thanks', 'create', 'write', 'explain', 'help'];
  return italian.filter((term) => text.includes(term)).length >= english.filter((term) => text.includes(term)).length ? 'it' : 'en';
}

function wantsJavaScript(text) { return /(javascript|js|codice|code|function|funzione|array|fetch|button|bottone|html|css|api)/i.test(text); }
function recentContext(context) { return context.turns.slice(-6).map((turn) => turn.input).join(' | '); }

function answerFor(input, language, context) {
  const text = normalize(input);
  const it = language === 'it';
  if (/^(ciao|hello|hi|hey|buongiorno|buonasera)/.test(text)) return it ? 'Ciao! Sono un assistente locale JavaScript. Posso analizzare richieste composte, generare codice e mantenere un contesto esteso.' : 'Hello! I am a local JavaScript assistant. I can handle compound requests, generate code, and keep extended context.';
  if (/(chi sei|what are you|cosa sai fare|what can you do)/.test(text)) return it ? 'Sono un agente locale deterministico: uso classificazione TF-IDF, ricette di codice, composizione di task e memoria locale. Non sono un LLM e non invento una risposta remota.' : 'I am a deterministic local agent using TF-IDF, code recipes, task composition, and local memory. I am not an LLM and do not call a remote model.';
  if (/(grazie|thanks|thank you)/.test(text)) return it ? 'Di nulla! Il contesto resta disponibile; usa “context” per visualizzarlo o “forget” per cancellarlo.' : 'You are welcome! Context remains available; use “context” to inspect it or “forget” to clear it.';
  if (/(continua|approfondisci|continue|expand|previous|precedente)/.test(text) && context.lastTopic) return it ? `Continuo dal tema “${context.lastTopic}”. Puoi chiedere piano, spiegazione, codice, test o revisione.` : `I can continue from “${context.lastTopic}”. Ask for a plan, explanation, code, tests, or review.`;
  if (wantsJavaScript(text)) return it ? 'Posso generare codice compositivo. Prova “js crea una form con validazione email, salva i dati e inviali via fetch” oppure chiedi una revisione del codice.' : 'I can generate composable code. Try “js create an email-validated form, save data, and send it with fetch”, or ask for a code review.';
  if (text.endsWith('?') || /^(come|cosa|perche|why|how|what|can|puoi)/.test(text)) return it ? `Posso ragionare localmente sul contesto recente (${context.turns.length} turn). Specifica obiettivo, input, vincoli e output desiderato.` : `I can reason locally over the recent context (${context.turns.length} turns). Specify goal, inputs, constraints, and expected output.`;
  return it ? `Ho ricevuto: “${String(input).trim()}”. Posso trasformarlo in un piano, una sequenza di task o codice JavaScript.` : `I received: “${String(input).trim()}”. I can turn it into a plan, task sequence, or JavaScript.`;
}

export function createChatEngine(state) {
  const context = state.context;
  return { reply(input) {
    const language = detectLanguage(input);
    const response = answerFor(input, language, context);
    context.language = language;
    context.lastTopic = String(input || '').trim();
    context.lastLanguage = language;
    context.lastContextPreview = recentContext(context);
    return { response, language };
  } };
}
