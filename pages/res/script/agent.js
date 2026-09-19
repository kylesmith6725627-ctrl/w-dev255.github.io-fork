import shellwords from 'https://cdn.jsdelivr.net/npm/shellwords@0.1.1/+esm';
import { createAgentState } from './agent-state.js';
import { createReasoner } from './agent-reasoning.js';
import { createAgentUI, createPrinter } from './agent-ui.js';
import { createTextToSpeech } from './agent-tts.js';
import { createCommands } from './agent-commands.js';
import { saveAgentContext } from './agent-context-storage.js';
import { createPersonalizedChatEngine } from './agent-personalized-chat.js';
import { createOutputValidator } from './agent-output-validator.js';
import { createDecisionWizard } from './agent-decision-wizard.js';
import { renderHTMLWithTemplate } from './agent-template-renderer.js';

const state = createAgentState();
const ui = createAgentUI();
const print = createPrinter(state, ui.outputBox);
const reasoner = createReasoner(state);
const chat = createPersonalizedChatEngine(state);
const wizard = createDecisionWizard();
const textToSpeech = createTextToSpeech({ state, button: ui.button, print });
const commands = createCommands({ state, outputBox: ui.outputBox, textToSpeech, decisionTree: wizard });
const outputValidator = createOutputValidator(state);

const generateHtml = (args, decision = {}) => {
  const request = args.join(' ');
  const plan = wizard.predict(request, { ...decision, intent: 'html' });
  return renderHTMLWithTemplate(request, { ...plan, userPreferences: state.context.userPreferences });
};
commands.html = (args) => generateHtml(args, { intent: 'html', category: 'html' });
commands['generate-html'] = commands.html;

let latestHtml = '';
let latestHtmlName = 'generated-page.html';

function downloadHtml(source, filename = 'generated-page.html') {
  const blob = new Blob([source], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(request) {
  const slug = String(request || 'generated-page').toLocaleLowerCase('it-IT')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${slug || 'generated-page'}.html`;
}

ui.downloadButton.addEventListener('click', () => {
  if (latestHtml) downloadHtml(latestHtml, latestHtmlName);
});

function tokenize(input) { return shellwords.split(input); }
function validateAndPrint(result, request, type, decision) {
  const validation = outputValidator.validate(result, request, type, decision);
  if (!validation.accepted) {
    print(outputValidator.rejectMessage(validation));
    return false;
  }
  if (type === 'html') {
    latestHtml = result;
    latestHtmlName = safeFilename(request);
    ui.downloadButton.disabled = false;
    ui.downloadButton.hidden = false;
    print(`Pagina HTML pronta: ${latestHtmlName}. Premi "Scarica .html" per salvarla.`);
  }
  print(reasoner.contextualize(result, decision));
  return true;
}

async function dispatch(input) {
  const value = input.trim();
  if (wizard.isActive()) {
    const followUp = wizard.answer(value);
    if (followUp.cancelled) { print(followUp.message); return; }
    if (followUp.active) { print(followUp.question); return; }
    if (followUp.complete) {
      const commandName = followUp.decision.command || followUp.decision.intent || 'js';
      if (commands[commandName]) {
        const result = await commands[commandName]([followUp.request]);
        const type = commandName === 'html' || commandName === 'generate-html' ? 'html' : 'js';
        if (result) validateAndPrint(result, followUp.request, type, followUp.decision);
      }
      return;
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
      if (prompt) { print(prompt.question); return; }
    }
  }

  if (commands[name]) {
    const result = await commands[name](args);
    const type = name === 'html' || name === 'generate-html' ? 'html' : name === 'js' || name === 'generate-js' ? 'js' : 'text';
    if (result) validateAndPrint(result, value, type, decision);
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
