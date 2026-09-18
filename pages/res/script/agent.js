(() => {
  'use strict';

  const state = { history: [], output: [], prompt: '> ' };
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
  const form = document.createElement('form');
  const commandArea = document.createElement('textarea');
  commandArea.id = 'agent-command';
  commandArea.name = 'command';
  commandArea.rows = 2;
  commandArea.autocomplete = 'off';
  commandArea.placeholder = 'Scrivi help e premi Invio';
  commandArea.setAttribute('aria-label', 'Comando');
  commandArea.style.width = 'calc(100% - 6rem)';
  commandArea.style.boxSizing = 'border-box';
  commandArea.style.backgroundColor = '#000000';
  commandArea.style.color = 'green';
  commandArea.style.fontFamily = 'monospace';
  commandArea.style.border = '3px solid green';
  commandArea.style.padding = '6px';
  const button = document.createElement('button');
  button.type = 'submit';
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
  }
  function parse(input) {
    return (input.match(/[^\s"']+|"[^"]*"|'[^']*'/g) || [])
      .map((part) => part.replace(/^("|')|("|')$/g, ''));
  }
  const commands = {
    help: () => 'Comandi: help, echo <testo>, history, clear, time',
    echo: (args) => args.join(' '),
    history: () => state.history.length ? state.history.map((item, i) => `${i + 1}: ${item}`).join('\n') : 'Nessun comando eseguito.',
    clear: () => { state.output.length = 0; outputBox.textContent = ''; return ''; },
    time: () => new Date().toLocaleString('it-IT')
  };
  function execute(input) {
    const value = input.trim();
    if (!value) return;
    state.history.push(value);
    print(`${state.prompt}${value}`);
    const tokens = parse(value);
    const name = (tokens.shift() || '').toLowerCase();
    if (!commands[name]) print(`Comando non riconosciuto: ${name}. Usa "help".`);
    else {
      const result = commands[name](tokens);
      if (result) print(result);
    }
    commandArea.value = '';
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); execute(commandArea.value); });
  commandArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); }
  });
  print('Agente JavaScript pronto. Usa "help" per iniziare.');
})();
