import { createAgentState } from './agent-state.js';
import { parseCommand } from './agent-parser.js';
import { createReasoner } from './agent-reasoning.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';
import { saveAgentContext } from './agent-context-storage.js';
import { createChatEngine } from './agent-chat.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const reasoner = createReasoner(state);
const chat = createChatEngine(state);
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech });

async function dispatch(tokens, originalInput) {
  let name = (tokens.shift() || '').toLowerCase();
  let args = tokens;
  let decision = { intent: name, confidence: 1, topic: args.join(' ') };
  if (!commands[name]) {
    decision = await reasoner.interpret(originalInput);
    if (!decision.command) {
      const conversational = chat.reply(originalInput);
      state.context.turns.push({ input: originalInput, intent: 'chat', command: 'chat', topic: state.context.lastTopic, language: conversational.language, timestamp: Date.now() });
      print(conversational.response);
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
  saveAgentContext(state);
  ui.commandArea.value = '';
  ui.commandArea.focus();
}

ui.form.addEventListener('submit', (event) => { event.preventDefault(); execute(ui.commandArea.value); });
ui.commandArea.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ui.form.requestSubmit(); }
});
window.addEventListener('pagehide', () => saveAgentContext(state));

reasoner.ready.then(() => {
  const size = state.localModel?.size || 0;
  print(`Agente conversazionale JavaScript pronto. Modello NLP locale: ${size} esempi. Chat bilingue IT/EN attiva; usa “help” per iniziare.`);
}).catch(() => print('Agente conversazionale JavaScript pronto con fallback locale.'));
