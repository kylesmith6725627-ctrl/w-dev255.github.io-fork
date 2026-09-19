import { createScrapingGuard } from './anti-scraping.js';

export function createAgentUI() {
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

  const downloadButton = document.createElement('button');
  downloadButton.type = 'button';
  downloadButton.id = 'agent-download-html';
  downloadButton.textContent = 'Scarica .html';
  downloadButton.disabled = true;
  downloadButton.setAttribute('aria-label', 'Scarica l’ultima pagina HTML generata');
  downloadButton.style.backgroundColor = '#000000';
  downloadButton.style.color = 'green';
  downloadButton.style.fontFamily = 'monospace';
  downloadButton.style.border = '3px solid green';
  downloadButton.style.padding = '6px';
  downloadButton.hidden = true;

  form.append(commandArea, button);
  terminal.append(outputBox, form, downloadButton);
  document.body.appendChild(terminal);

  const scrapingGuard = createScrapingGuard({
    form,
    commandArea,
    onBlocked: (message) => {
      outputBox.textContent += `${outputBox.textContent ? '\n' : ''}${message}`;
    },
  });

  return { form, commandArea, button, outputBox, downloadButton, scrapingGuard };
}

export function createPrinter(state, outputBox) {
  return function print(message = '') {
    state.output.push(String(message));
    outputBox.textContent = state.output.join('\n');
    outputBox.scrollTop = outputBox.scrollHeight;
  };
}
