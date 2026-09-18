(() => {
  'use strict';

  const STORAGE_KEY = 'wdev255-agent-tts';
  const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';
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
    return matches.map((part) => part.replace(/^("|')|( "|' )$/g, '').trim());
  }
  function getConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }
  function saveConfig(config) { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function textToSpeech(args) {
    const config = getConfig();
    if (!config.apiKey) return 'Configura prima la chiave: tts-config <API_KEY> [VOICE_ID]. La chiave resta solo nel browser.';
    const voiceId = args[0] || config.voiceId || DEFAULT_VOICE;
    const text = args.slice(1).join(' ').trim();
    if (!text) return 'Uso: tts <voice-id opzionale> "testo da convertire"';
    if (text.length > 5000) return 'Testo troppo lungo: massimo 5000 caratteri.';
    state.busy = true; button.disabled = true; print('Generazione audio in corso...');
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: 'POST',
        headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', output_format: 'mp3_44100_128', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
      });
      if (!response.ok) throw new Error(`API ${response.status}: ${(await response.text()).slice(0, 180)}`);
      const filename = `wdev255-${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`;
      downloadBlob(await response.blob(), filename);
      return `Audio MP3 scaricato: ${filename}`;
    } catch (error) { return `Errore TTS: ${error.message}. Verifica API key, voice ID e CORS.`; }
    finally { state.busy = false; button.disabled = false; }
  }
  const commands = {
    help: () => 'Comandi: help, echo <testo>, history, clear, time, goto <pagina>, tts-config <API_KEY> [VOICE_ID], tts [VOICE_ID] "testo"',
    echo: (args) => args.join(' '),
    history: () => state.history.length ? state.history.map((item, i) => `${i + 1}: ${item}`).join('\n') : 'Nessun comando eseguito.',
    clear: () => { state.output.length = 0; outputBox.textContent = ''; return ''; },
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
      window.location.href = destination; return `Apertura di ${args[0]}...`;
    }
  };
  async function dispatch(tokens) {
    const name = (tokens.shift() || '').toLowerCase();
    if (!name) return;
    if (!commands[name]) { print(`Comando non riconosciuto: ${name}. Usa "help".`); return; }
    try { const result = await commands[name](tokens); if (result) print(result); }
    catch (error) { print(`Errore: ${error.message}`); }
  }
  async function execute(input) {
    const value = input.trim();
    if (!value || state.busy) return;
    state.history.push(value); print(`${state.prompt}${value}`); await dispatch(parse(value));
    commandArea.value = ''; commandArea.focus();
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); execute(commandArea.value); });
  commandArea.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  print('Agente JavaScript pronto. Usa "help" per iniziare.');
})();
