(() => {
  'use strict';

  const STORAGE_KEY = 'wdev255-agent-tts-local';
  const state = { history: [], output: [], prompt: '> ', busy: false };

  document.body.style.backgroundColor = '#000000';
  document.body.style.color = 'green';
  document.body.style.border = '3px solid green';
  document.body.style.padding = '6px';
  document.body.style.fontFamily = 'monospace';

  const terminal = document.createElement('section');
  terminal.setAttribute('aria-label', 'JavaScript agent');
  terminal.style.maxWidth = '48rem';
  terminal.style.margin = '0 auto';

  const outputBox = document.createElement('pre');
  outputBox.id = 'agent-output';
  outputBox.style.whiteSpace = 'pre-wrap';
  outputBox.style.minHeight = '8rem';
  outputBox.style.margin = '0 0 6px';
  outputBox.style.color = 'green';

  const form = document.createElement('form');
  form.id = 'agent-form';
  form.style.display = 'flex';
  form.style.gap = '6px';
  form.style.alignItems = 'flex-start';

  const commandArea = document.createElement('textarea');
  commandArea.id = 'agent-command';
  commandArea.name = 'command';
  commandArea.rows = 2;
  commandArea.autocomplete = 'off';
  commandArea.placeholder = 'Scrivi help e premi Invio';
  commandArea.setAttribute('aria-label', 'Comando');
  commandArea.style.flex = '1';
  commandArea.style.resize = 'vertical';
  commandArea.style.backgroundColor = '#000000';
  commandArea.style.color = 'green';
  commandArea.style.fontFamily = 'monospace';
  commandArea.style.border = '3px solid green';
  commandArea.style.padding = '6px';

  const button = document.createElement('button');
  button.type = 'submit';
  button.id = 'agent-submit';
  button.textContent = 'Esegui';
  button.style.backgroundColor = '#000000';
  button.style.color = 'green';
  button.style.fontFamily = 'monospace';
  button.style.border = '3px solid green';
  button.style.padding = '6px';

  form.append(commandArea, button);
  terminal.append(outputBox, form);
  document.body.appendChild(terminal);

  function print(message = '') {
    state.output.push(String(message));
    outputBox.textContent = state.output.join('\n');
    outputBox.scrollTop = outputBox.scrollHeight;
  }

  function parse(input) {
    const matches = input.match(/[^\s"']+|"[^"]*"|'[^']*'/g) || [];
    return matches.map((part) => part.replace(/^("|')|("|')$/g, '').trim());
  }

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function getVoices() {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices();
  }

  function getVoiceByName(name) {
    const target = (name || '').toLowerCase();
    const voices = getVoices();
    return voices.find((voice) => (
      voice.name.toLowerCase() === target ||
      voice.lang.toLowerCase() === target ||
      `${voice.name} ${voice.lang}`.toLowerCase().includes(target)
    )) || null;
  }

  function speakText(args) {
    if (!('speechSynthesis' in window)) {
      return 'Il browser non supporta SpeechSynthesis. Nessuna dipendenza esterna, ma la sintesi vocale locale non è disponibile.';
    }

    const config = getConfig();
    const voiceName = args[0] || config.voiceName || '';
    const text = args.slice(1).join(' ').trim();
    if (!text) return 'Uso: tts [voice-name] "testo" oppure usa voce salvata con tts-config <voice-name>';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = getVoices();
    if (voiceName) {
      const selected = getVoiceByName(voiceName) || voices.find((voice) => voice.lang.startsWith('it'));
      if (selected) utterance.voice = selected;
    } else {
      const preferred = voices.find((voice) => voice.lang.startsWith('it')) || voices[0];
      if (preferred) utterance.voice = preferred;
    }

    if (state.busy) {
      speechSynthesis.cancel();
    }

    state.busy = true;
    button.disabled = true;
    print('Riproduzione vocale locale in corso...');

    utterance.onend = () => {
      state.busy = false;
      button.disabled = false;
      print('Riproduzione completata.');
    };
    utterance.onerror = (event) => {
      state.busy = false;
      button.disabled = false;
      print(`Errore di sintesi vocale: ${event.error || 'sconosciuto'}`);
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    return `Sintesi vocale avviata: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`;
  }

  const commands = {
    help() {
      return 'Comandi: help, echo <testo>, history, clear, time, goto <pagina>, voices, tts-config <voice-name>, tts [voice-name] "testo"';
    },
    echo(args) { return args.join(' '); },
    history() {
      return state.history.length
        ? state.history.map((item, index) => `${index + 1}: ${item}`).join('\n')
        : 'Nessun comando eseguito.';
    },
    clear() {
      state.output.length = 0;
      outputBox.textContent = '';
      return '';
    },
    time() { return new Date().toLocaleString('it-IT'); },
    voices() {
      const voices = getVoices();
      if (!voices.length) return 'Nessuna voce rilevata. Il browser potrebbe richiedere il caricamento delle voci.';
      return voices.map((voice, index) => `${index + 1}: ${voice.name} (${voice.lang})`).join('\n');
    },
    'tts-config'(args) {
      const voiceName = args[0];
      if (!voiceName) return 'Uso: tts-config <voice-name>';
      saveConfig({ voiceName });
      return `Voce predefinita salvata: ${voiceName}`;
    },
    tts: speakText,
    goto(args) {
      const pages = { home: '../index.html', agent: 'agent.html', quiz: 'quiz_elettrotecnica.html', tools: 'tools.html' };
      const destination = pages[(args[0] || '').toLowerCase()];
      if (!destination) return 'Pagina non disponibile. Usa: goto home|agent|quiz|tools';
      window.location.href = destination;
      return `Apertura di ${args[0]}...`;
    }
  };

  async function dispatch(tokens) {
    const name = (tokens.shift() || '').toLowerCase();
    if (!name) return;
    if (!commands[name]) { print(`Comando non riconosciuto: ${name}. Usa "help".`); return; }
    try {
      const result = await commands[name](tokens);
      if (result) print(result);
    } catch (error) { print(`Errore: ${error.message}`); }
  }

  async function execute(input) {
    const value = input.trim();
    if (!value || state.busy) return;
    state.history.push(value);
    print(`${state.prompt}${value}`);
    await dispatch(parse(value));
    commandArea.value = '';
    commandArea.focus();
  }

  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => print('Voci di sistema rilevate.');
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); execute(commandArea.value); });
  commandArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });

  print('Agente JavaScript pronto. Nessuna dipendenza esterna. Usa "help" per iniziare.');
})();
