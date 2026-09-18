const STORAGE_KEY = 'wdev255-agent-context-v2';
const COOKIE_NAME = 'wdev255-agent-context';
const STORAGE_MAX_TURNS = 100;
const MAX_HISTORY = 100;

function readCookie(name) {
  const prefix = `${name}=`;
  return document.cookie.split('; ').find((item) => item.startsWith(prefix))?.slice(prefix.length) || null;
}

function shape(saved) {
  return {
    history: Array.isArray(saved?.history) ? saved.history.slice(-MAX_HISTORY) : [],
    context: {
      turns: Array.isArray(saved?.context?.turns) ? saved.context.turns.slice(-STORAGE_MAX_TURNS) : [],
      lastIntent: saved?.context?.lastIntent || null,
      lastTopic: saved?.context?.lastTopic || '',
      language: saved?.context?.language || 'it',
      lastLanguage: saved?.context?.lastLanguage || 'it'
    }
  };
}

export function loadAgentContext() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return shape(JSON.parse(local));
  } catch (_) { /* fallback cookie */ }
  try {
    const cookie = readCookie(COOKIE_NAME);
    return cookie ? shape(JSON.parse(decodeURIComponent(cookie))) : null;
  } catch (_) { return null; }
}

export function saveAgentContext(state) {
  const payload = shape({ history: state.history, context: state.context });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (_) {
    try {
      const encoded = encodeURIComponent(JSON.stringify({ history: payload.history.slice(-20), context: { ...payload.context, turns: payload.context.turns.slice(-12) } }));
      if (encoded.length > 3800) return false;
      document.cookie = `${COOKIE_NAME}=${encoded}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
      return true;
    } catch (__) { return false; }
  }
}

export function clearAgentContext() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* noop */ }
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}
