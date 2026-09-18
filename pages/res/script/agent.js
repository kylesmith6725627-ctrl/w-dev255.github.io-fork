import { createAgentState } from './agent-state.js';
import { parseCommand } from './agent-parser.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech });

async function dispatch(tokens) {
  const name = (tokens.shift() || '').toLowerCase();
  if (!name) return;
  if (!commands[name]) {
    print(`Comando non riconosciuto: ${name}. Usa "help".`);
    return;
  }
  try {
    const result = await commands[name](tokens);
    if (result) print(result);
  } catch (error) {
    print(`Errore: ${error.message}`);
  }
}

async function execute(input) {
  const value = input.trim();
  if (!value || state.busy) return;
  state.history.push(value);
  print(`${state.prompt}${value}`);
  await dispatch(parseCommand(value));
  ui.commandArea.value = '';
  ui.commandArea.focus();
}

ui.form.addEventListener('submit', (event) => {
  event.preventDefault();
  execute(ui.commandArea.value);
});

ui.commandArea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    ui.form.requestSubmit();
  }
});

print('Agente JavaScript pronto. Usa "help" per iniziare.');
