function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9#._/\s?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectLanguage(input) {
  const text = normalize(input);
  const italian = ['ciao', 'come stai', 'che cosa', 'cosa', 'perche', 'puoi', 'vorrei', 'aiutami', 'grazie', 'crea', 'scrivi', 'spiega'];
  const english = ['hello', 'how are you', 'what', 'why', 'can you', 'please', 'thanks', 'create', 'write', 'explain', 'help'];
  const itScore = italian.filter((term) => text.includes(term)).length;
  const enScore = english.filter((term) => text.includes(term)).length;
  return itScore >= enScore ? 'it' : 'en';
}

function wantsJavaScript(text) {
  return /(javascript|js|codice|code|function|funzione|array|fetch|button|bottone|html|css|api)/i.test(text);
}

function answerFor(input, language, context) {
  const text = normalize(input);
  const isItalian = language === 'it';

  if (/^(ciao|hello|hi|hey|buongiorno|buonasera)/.test(text)) {
    return isItalian
      ? 'Ciao! Sono un assistente locale in JavaScript. Posso spiegare concetti, aiutarti con JavaScript e mantenere il contesto della conversazione.'
      : 'Hello! I am a local JavaScript assistant. I can explain concepts, help with JavaScript, and keep conversation context.';
  }
  if (/(come stai|how are you)/.test(text)) {
    return isItalian ? 'Sto bene e sono pronto ad aiutarti. Cosa vuoi costruire?' : 'I am ready to help. What would you like to build?';
  }
  if (/(chi sei|what are you|cosa sai fare|what can you do)/.test(text)) {
    return isItalian
      ? 'Sono una simulazione locale ispirata a un chatbot: classifico la richiesta, uso il contesto recente e genero risposte predefinite senza chiamare un modello remoto.'
      : 'I am a local chatbot-inspired simulation: I classify the request, use recent context, and generate curated answers without calling a remote model.';
  }
  if (/(grazie|thanks|thank you)/.test(text)) return isItalian ? 'Di nulla!' : 'You are welcome!';
  if (/(continua|approfondisci|continue|expand|previous|precedente)/.test(text) && context.lastTopic) {
    return isItalian
      ? `Posso continuare sul tema “${context.lastTopic}”. Specifica se vuoi una spiegazione, un esempio o codice.`
      : `I can continue with “${context.lastTopic}”. Tell me whether you want an explanation, an example, or code.`;
  }
  if (wantsJavaScript(text)) {
    return isItalian
      ? 'Posso aiutarti con JavaScript. Prova: “crea un bottone che mostra un messaggio”, “spiega fetch async/await” oppure “scrivi una funzione per filtrare un array”.'
      : 'I can help with JavaScript. Try: “create a button that shows a message”, “explain fetch async/await”, or “write a function to filter an array”.';
  }
  if (text.endsWith('?') || /^(come|cosa|perche|why|how|what|can|puoi)/.test(text)) {
    return isItalian
      ? 'Posso rispondere in modo locale e sintetico. Prova a formulare una domanda più specifica oppure chiedimi un esempio JavaScript.'
      : 'I can answer locally and briefly. Try a more specific question or ask me for a JavaScript example.';
  }
  return isItalian
    ? `Ho ricevuto: “${String(input).trim()}”. Posso aiutarti con conversazione bilingue, NLP locale e JavaScript.`
    : `I received: “${String(input).trim()}”. I can help with bilingual conversation, local NLP, and JavaScript.`;
}

/**
 * Lightweight, deterministic ChatGPT-2-style conversational layer.
 * It is not a trained language model: it provides bilingual intent-aware
 * replies and context while keeping the site fully offline.
 */
export function createChatEngine(state) {
  const context = state.context;
  return {
    reply(input) {
      const language = detectLanguage(input);
      const topic = String(input || '').trim();
      const response = answerFor(topic, language, context);
      context.language = language;
      context.lastTopic = topic;
      context.lastLanguage = language;
      return { response, language };
    }
  };
}
