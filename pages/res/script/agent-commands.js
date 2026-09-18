import { saveConfig } from './agent-storage.js';

const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';

export function createCommands({ state, outputBox, textToSpeech }) {
  return {
    help: () => 'Comandi: help, echo <testo>, history, clear, time, goto <pagina>, tts-config <API_KEY> [VOICE_ID], tts [VOICE_ID] "testo"',
    echo: (args) => args.join(' '),
    history: () => state.history.length
      ? state.history.map((item, index) => `${index + 1}: ${item}`).join('\n')
      : 'Nessun comando eseguito.',
    clear: () => {
      state.output.length = 0;
      outputBox.textContent = '';
      return '';
    },
    time: () => new Date().toLocaleString('it-IT'),
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
