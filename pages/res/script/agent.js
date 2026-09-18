import { createAgentState } from './agent-state.js';
import { parseCommand } from './agent-parser.js';
import { createReasoner } from './agent-reasoning.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const reasoner = createReasoner(state);
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech });

async function dispatch(tokens, originalInput) {
  let name = (tokens.shift() || '').toLowerCase();
  let args = tokens;
  let decision = { intent: name, confidence: 1, topic: args.join(' ') };

  // I comandi espliciti hanno priorità. Le frasi naturali passano dal livello
  // di ragionamento, che usa anche le richieste precedenti della sessione.
  if (!commands[name]) {
    decision = reasoner.interpret(originalInput);
    if (!decision.command) {
      print('Non ho capito la richiesta. Prova “help” oppure specifica meglio obiettivo e argomento.');
      return;
    }
    name = decision.command;
    args = decision.args || [];
  }

  try {
    const result = await commands[name](args);
    if (result) print(reasoner.contextualize(result, decision));
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

print('Agente JavaScript pronto. Usa “help” per iniziare. Ragionamento contestuale locale attivo.');
