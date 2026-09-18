import { saveConfig } from './agent-storage.js';
import { generateJavaScript, getJavaScriptGeneratorHelp } from './agent-codegen.js';
import { getNaturalLanguageHelp } from './agent-nlp.js';

const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';

export function createCommands({ state, outputBox, textToSpeech }) {
  return {
    help: () => `Comandi: help, echo <testo>, history, clear, time, goto <pagina>, js <richiesta>, context, forget, tts-config <API_KEY> [VOICE_ID], tts [VOICE_ID] "testo".\nGeneratore: ${getJavaScriptGeneratorHelp()}\n${getNaturalLanguageHelp()}`,
    echo: (args) => args.join(' '),
    history: () => state.history.length ? state.history.map((item, index) => `${index + 1}: ${item}`).join('\n') : 'Nessun comando eseguito.',
    context: () => state.context.turns.length ? state.context.turns.map((turn, index) => `${index + 1}. [${turn.intent || 'chat'}] ${turn.input}`).join('\n') : 'Contesto vuoto.',
    forget: () => {
      state.history.length = 0;
      state.context.turns.length = 0;
      state.context.lastIntent = null;
      state.context.lastTopic = '';
      state.context.language = 'it';
      state.context.lastLanguage = 'it';
      return 'Contesto della sessione cancellato.';
    },
    clear: () => { state.output.length = 0; outputBox.textContent = ''; return ''; },
    time: () => new Date().toLocaleString('it-IT'),
    js: async (args) => generateJavaScript(args.join(' ')),
    'generate-js': async (args) => generateJavaScript(args.join(' ')),
    'tts-config': (args) => {
      if (!args[0]) return 'Uso: tts-config <API_KEY> [VOICE_ID]';
      saveConfig({ apiKey: args[0], voiceId: args[1] || DEFAULT_VOICE });
      return 'Configurazione TTS salvata in localStorage. Non usare chiavi condivise su computer pubblici.';
    },
    tts: textToSpeech,
    goto: (args) => {
      const pages = { home: '../index.html', agent: 'agent.html', quiz: 'quiz_elettrotecnica.html', tools: 'tools.html' };
      const destination = pages[(args[0] || '').toLowerCase()];
      if (!destination) return 'Pagina non disponibile. Usa: goto home|agent|quiz|tools';
      window.location.href = destination;
      return `Apertura di ${args[0]}...`;
    }
  };
}
