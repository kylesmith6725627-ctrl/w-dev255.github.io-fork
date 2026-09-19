import shellwords from 'https://cdn.jsdelivr.net/npm/shellwords@0.1.1/+esm';
import { createAgentState } from './agent-state.js';
import { createReasoner } from './agent-reasoning.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';
import { saveAgentContext } from './agent-context-storage.js';
import { createChatEngine } from './agent-chat.js';
import { createDecisionTree, formatTaskPlan } from './agent-decision-tree.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const reasoner = createReasoner(state);
const chat = createChatEngine(state);
const decisionTree = createDecisionTree(state);
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech, decisionTree });

function tokenize(input) { return shellwords.split(input); }

async function dispatch(input) {
  const value = input.trim();
  const tokens = tokenize(value);
  let name = (tokens.shift() || '').toLowerCase();
  let args = tokens;
  let decision = { intent: name, confidence: 1, topic: args.join(' ') };

  if (!commands[name]) {
    decision = await reasoner.interpret(value);
    if (decision.command) { name = decision.command; args = decision.args || []; }
  }

  const planningCommands = new Set(['js', 'generate-js', 'html', 'generate-html', 'goto', 'scrape', 'weather', 'meteo', 'country', 'paese', 'wiki', 'wikimedia']);
  if (planningCommands.has(name) || decision.command) {
    const plan = decisionTree.predict(value, { intent: decision.intent || name });
    if (plan.steps?.length) print(formatTaskPlan(plan, decisionTree.examples));
  }

  if (commands[name]) {
    const result = await commands[name](args);
    if (result) print(reasoner.contextualize(result, decision));
    return;
  }
  print(chat.reply(value).response);
}

ui.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const value = ui.commandArea.value.trim();
  if (!value || state.busy) return;
  state.history.push(value);
  print(`${state.prompt}${value}`);
  try { await dispatch(value); } catch (error) { print(`Errore: ${error.message}`); }
  saveAgentContext(state);
  ui.commandArea.value = '';
  ui.commandArea.focus();
});

print('Conversational JavaScript agent ready. Type help, or chat in Italian / English.');
