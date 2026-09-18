(() => {
  'use strict';

  const state = {
    history: [],
    output: [],
    prompt: '> '
  };

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
    return matches.map((part) => part.replace(/^("|')|("|')$/g, ''));
  }

  const commands = {
    help() {
      return 'Comandi: help, echo <testo>, history, clear, time, goto <pagina>';
    },
    echo(args) {
      return args.join(' ');
    },
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
    time() {
      return new Date().toLocaleString('it-IT');
    },
    goto(args) {
      const pages = {
        home: '../index.html',
        agent: 'agent.html',
        quiz: 'quiz_elettrotecnica.html',
        tools: 'tools.html'
      };
      const destination = pages[(args[0] || '').toLowerCase()];
      if (!destination) return 'Pagina non disponibile. Usa: goto home|agent|quiz|tools';
      window.location.href = destination;
      return `Apertura di ${args[0]}...`;
    }
  };

  function dispatch(tokens) {
    const name = (tokens.shift() || '').toLowerCase();
    if (!name) return;
    if (!commands[name]) {
      print(`Comando non riconosciuto: ${name}. Usa "help".`);
      return;
    }
    try {
      const result = commands[name](tokens);
      if (result) print(result);
    } catch (error) {
      print(`Errore: ${error.message}`);
    }
  }

  function execute(input) {
    const value = input.trim();
    if (!value) return;
    state.history.push(value);
    print(`${state.prompt}${value}`);
    dispatch(parse(value));
    commandArea.value = '';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    execute(commandArea.value);
  });

  commandArea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  print('Agente JavaScript pronto. Usa "help" per iniziare.');
})();
