import { createAgentState } from './agent-state.js';
import { parseCommand } from './agent-parser.js';
import { interpretNaturalLanguage } from './agent-nlp.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech });

async function dispatch(tokens, originalInput) {
  let name = (tokens.shift() || '').toLowerCase();
  let args = tokens;

  // I comandi espliciti restano prioritari; il classificatore interviene solo
  // quando la prima parola non corrisponde a un comando noto.
  if (!commands[name]) {
    const interpretation = interpretNaturalLanguage(originalInput);
    if (!interpretation) {
      print(`Non ho capito la richiesta. Usa "help" oppure prova una frase naturale.`);
      return;
    }
    name = interpretation.command;
    args = interpretation.args;
  }

  try {
    const result = await commands[name](args);
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
  await dispatch(parseCommand(value), value);
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

print('Agente JavaScript pronto. Usa "help" per iniziare. NLP locale attivo: nessuna API o connessione esterna.');
