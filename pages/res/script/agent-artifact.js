(() => {
  'use strict';

  const STORAGE_KEY = 'wdev255-agent-artifact-v1';
  const output = () => document.querySelector('#agent-output');
  const form = () => document.querySelector('#agent-form');
  const input = () => document.querySelector('#agent-command');
  const normalize = (value) => String(value || '').trim();
  const isGeneration = (value) => /^(?:js|generate-js|html|generate-html)\b/i.test(value);
  const isEdit = (value) => /^(?:edit|modifica|modificare|cambia|cambiare|aggiorna|aggiungi|rimuovi|remove|continue|continua|improve|migliora)\b/i.test(value);

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { return null; }
  }

  const artifact = load() || {
    version: 1,
    type: null,
    request: '',
    source: '',
    revision: 0,
    updatedAt: null
  };

  function save() {
    artifact.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(artifact));
  }

  function print(message) {
    const box = output();
    if (!box) return;
    box.textContent += `${box.textContent ? '\\n' : ''}${message}`;
    box.scrollTop = box.scrollHeight;
  }

  function extractGeneratedText(text) {
    const marker = text.lastIndexOf('> ');
    return marker >= 0 ? text.slice(marker + 2).trim() : text.trim();
  }

  function captureGeneration() {
    const box = output();
    if (!box) return;
    const text = extractGeneratedText(box.textContent || '');
    if (!text || text.length < 20) return;
    const request = artifact.request || '';
    const type = artifact.type || (/<(?:!doctype|html|section|div)\b/i.test(text) ? 'html' : 'js');
    if (isGeneration(request) || !artifact.source) {
      artifact.type = type;
      artifact.source = text;
      artifact.revision += 1;
      save();
    }
  }

  function applyEdit(request) {
    const text = normalize(request);
    if (!artifact.source) {
      print('Nessun artefatto modificabile. Genera prima una pagina con “html ...” o codice con “js ...”.');
      return true;
    }

    const payload = text.replace(/^(edit|modifica|modificare|cambia|cambiare|aggiorna|aggiungi|rimuovi|remove|continue|continua|improve|migliora)\\s*/i, '').trim();
    if (!payload) {
      print(`Artefatto ${artifact.type} corrente, revisione ${artifact.revision}. Specifica la modifica richiesta.`);
      return true;
    }

    const removeMatch = payload.match(/^(?:rimuovi|remove)\\s+["“”']?(.+?)["“”']?$/i);
    const addMatch = payload.match(/^(?:aggiungi|add)\\s+["“”']?(.+?)["“”']?$/i);
    if (removeMatch) {
      const target = removeMatch[1].trim();
      artifact.source = artifact.source.split(target).join('');
    } else if (addMatch) {
      const addition = addMatch[1].trim();
      artifact.source += `\\n\\n/* Modifica agente: ${addition} */`;
    } else {
      artifact.source += `\\n\\n/* Revisione agente: ${payload} */`;
    }

    artifact.request = payload;
    artifact.revision += 1;
    save();
    print(`Artefatto ${artifact.type} aggiornato alla revisione ${artifact.revision}. Usa “artifact” per visualizzarlo o “download-artifact” per scaricarlo.`);
    return true;
  }

  function download() {
    if (!artifact.source) { print('Nessun artefatto disponibile.'); return; }
    const extension = artifact.type === 'html' ? 'html' : 'js';
    const blob = new Blob([artifact.source], { type: artifact.type === 'html' ? 'text/html' : 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wdev255-artifact-v${artifact.revision}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handle(event) {
    const value = normalize(input()?.value);
    if (!value) return;
    if (isEdit(value)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      applyEdit(value);
      input().value = '';
      return;
    }
    if (/^artifact\\b/i.test(value)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      print(artifact.source ? `Artefatto ${artifact.type}, revisione ${artifact.revision}:\\n${artifact.source}` : 'Nessun artefatto disponibile.');
      input().value = '';
      return;
    }
    if (/^download-artifact\\b/i.test(value)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      download();
      input().value = '';
    }
    artifact.request = value;
    save();
  }

  function init() {
    const target = form();
    if (!target || target.dataset.artifactBridge === 'true') return;
    target.dataset.artifactBridge = 'true';
    target.addEventListener('submit', handle, true);
    const box = output();
    if (box) new MutationObserver(captureGeneration).observe(box, { childList: true, characterData: true, subtree: true });
    window.agentArtifact = Object.freeze({ get: () => ({ ...artifact }), edit: applyEdit, download });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
