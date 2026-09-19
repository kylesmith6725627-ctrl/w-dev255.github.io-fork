const STORAGE_KEY = 'wdev255-agent-artifact-v2';
const MAX_SOURCE_LENGTH = 250000;

function emptyArtifact() {
  return { version: 2, type: null, request: '', source: '', revision: 0, updatedAt: null };
}

function safeRead() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!value || typeof value.source !== 'string') return emptyArtifact();
    return { ...emptyArtifact(), ...value, source: value.source.slice(0, MAX_SOURCE_LENGTH) };
  } catch (_) { return emptyArtifact(); }
}

function safeWrite(value) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); return true; } catch (_) { return false; }
}

function normalizeInstruction(value) {
  return String(value || '').trim().replace(/^(edit|modifica|modificare|cambia|cambiare|aggiorna|improve|migliora)\s*/i, '').trim();
}

export function createArtifactStore() {
  let artifact = safeRead();

  function persist() {
    artifact.updatedAt = new Date().toISOString();
    safeWrite(artifact);
    return { ...artifact };
  }

  function set(type, source, request) {
    const value = String(source || '').slice(0, MAX_SOURCE_LENGTH);
    if (!value) return { ...artifact };
    artifact = { version: 2, type, request: String(request || ''), source: value, revision: artifact.revision + 1, updatedAt: null };
    return persist();
  }

  function clear() {
    artifact = emptyArtifact();
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* noop */ }
    return { ...artifact };
  }

  function edit(instruction) {
    if (!artifact.source) return { ok: false, message: 'Nessun artefatto modificabile. Genera prima codice con “js ...” o una pagina con “html ...”.' };
    const request = normalizeInstruction(instruction);
    if (!request) return { ok: false, message: 'Specifica la modifica da applicare all’artefatto corrente.' };

    let source = artifact.source;
    const replace = request.match(/^replace\s+["“”']([\s\S]*?)["“”']\s+(?:with|con)\s+["“”']([\s\S]*?)["“”']$/i);
    const remove = request.match(/^(?:remove|rimuovi)\s+["“”']([\s\S]*?)["“”']$/i);
    const add = request.match(/^(?:add|aggiungi)\s+["“”']([\s\S]*?)["“”']$/i);

    if (replace) {
      if (!source.includes(replace[1])) return { ok: false, message: `Testo da sostituire non trovato: “${replace[1]}”.` };
      source = source.split(replace[1]).join(replace[2]);
    } else if (remove) {
      if (!source.includes(remove[1])) return { ok: false, message: `Testo da rimuovere non trovato: “${remove[1]}”.` };
      source = source.split(remove[1]).join('');
    } else if (add) {
      source = artifact.type === 'html'
        ? source.replace(/<\/body>\s*<\/html>\s*$/i, `${add[1]}\n</body>\n</html>`)
        : `${source}\n\n${add[1]}`;
    } else {
      return { ok: false, message: 'Usa “replace "vecchio" with "nuovo"”, “remove "testo"” oppure “add "testo"”.' };
    }

    artifact = { ...artifact, source: source.slice(0, MAX_SOURCE_LENGTH), request, revision: artifact.revision + 1 };
    return { ok: true, artifact: persist() };
  }

  function get() { return { ...artifact }; }
  function download() {
    if (!artifact.source) return false;
    const extension = artifact.type === 'html' ? 'html' : 'js';
    const blob = new Blob([artifact.source], { type: artifact.type === 'html' ? 'text/html' : 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wdev255-artifact-v${artifact.revision}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  return { get, set, edit, clear, download };
}
