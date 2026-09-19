import shellwords from 'https://cdn.jsdelivr.net/npm/shellwords@0.1.1/+esm';
import { createAgentState } from './agent-state.js';
import { createReasoner } from './agent-reasoning.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';
import { saveAgentContext } from './agent-context-storage.js';
import { createChatEngine } from './agent-chat.js';
import { createOutputValidator } from './agent-output-validator.js';
import { createDecisionWizard } from './agent-decision-wizard.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const reasoner = createReasoner(state);
const chat = createChatEngine(state);
const wizard = createDecisionWizard();
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech, decisionTree: wizard });
const outputValidator = createOutputValidator(state);

function tokenize(input) { return shellwords.split(input); }

function validateAndPrint(result, request, type, decision) {
  const validation = outputValidator.validate(result, request, type, decision);
  if (!validation.accepted) {
    print(outputValidator.rejectMessage(validation));
    return false;
  }
  print(reasoner.contextualize(result, decision));
  return true;
}

async function dispatch(input) {
  const value = input.trim();

  if (wizard.isActive()) {
    const followUp = wizard.answer(value);
    if (followUp.cancelled) {
      print(followUp.message);
      return;
    }
    if (followUp.active) {
      print(followUp.question);
      return;
    }
    if (followUp.complete) {
      const commandName = followUp.decision.command || followUp.decision.intent || 'js';
      const commandArgs = [followUp.request];
      const nextDecision = followUp.decision;
      if (commands[commandName]) {
        const result = await commands[commandName](commandArgs);
        const type = commandName === 'html' || commandName === 'generate-html' ? 'html' : 'js';
        if (result) {
          validateAndPrint(result, followUp.request, type, nextDecision);
        }
        return;
      }
    }
  }

  const tokens = tokenize(value);
  let name = (tokens.shift() || '').toLowerCase();
  let args = tokens;
  let decision = { intent: name, category: name, confidence: 1, topic: args.join(' ') };

  if (!commands[name]) {
    decision = await reasoner.interpret(value);
    if (decision.command) {
      name = decision.command;
      args = decision.args || [];
      const prompt = wizard.start(value, decision);
      if (prompt) {
        print(prompt.question);
        return;
      }
    }
  }

  if (commands[name]) {
    const result = await commands[name](args);
    const type = name === 'html' || name === 'generate-html' ? 'html' : name === 'js' || name === 'generate-js' ? 'js' : 'text';
    if (result) {
      validateAndPrint(result, value, type, decision);
    }
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
