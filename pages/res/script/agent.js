import shellwords from 'https://cdn.jsdelivr.net/npm/shellwords@0.1.1/+esm';
import { createAgentState } from './agent-state.js';
import { createReasoner } from './agent-reasoning.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';
import { saveAgentContext } from './agent-context-storage.js';
import { createChatEngine } from './agent-chat.js';
import { createOutputValidator } from './agent-output-validator.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const reasoner = createReasoner(state);
const chat = createChatEngine(state);
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech });
const outputValidator = createOutputValidator(state);

function tokenize(input) {
  return shellwords.split(input);
}

function validateAndPrint(result, request, type, decision) {
  const validation = outputValidator.validate(result, request, type);
  if (!validation.accepted) {
    print(outputValidator.rejectMessage(validation));
    return false;
  }
  print(reasoner.contextualize(result, decision));
  return true;
}

async function dispatch(input) {
  const value = input.trim();
  const tokens = tokenize(value);
  let name = (tokens.shift() || '').toLowerCase();
  let args = tokens;
  let decision = { intent: name, confidence: 1, topic: args.join(' ') };

  if (!commands[name]) {
    decision = await reasoner.interpret(value);
    if (decision.command) {
      name = decision.command;
      args = decision.args || [];
    }
  }

  if (commands[name]) {
    const result = await commands[name](args);
    const type = ['js', 'generate-js', 'html', 'generate-html'].includes(name) ? name.startsWith('html') ? 'html' : 'js' : 'js';
    if (result) {
      const accepted = validateAndPrint(result, value, type, decision);
      if (accepted) return;
      return;
    }
    return;
  }

  const conversational = chat.reply(value);
  print(conversational.response);
}

ui.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = ui.commandArea.value.trim();
  if (!value || state.busy) return;
  state.history.push(value);
  print(`${state.prompt}${value}`);
  try {
    await dispatch(value);
  } catch (error) {
    print(`Errore: ${error.message}`);
  }
  saveAgentContext(state);
  ui.commandArea.value = '';
  ui.commandArea.focus();
});

print('Conversational JavaScript agent ready. Type help, or chat in Italian / English.');
