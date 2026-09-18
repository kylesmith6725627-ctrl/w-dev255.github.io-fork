const COOKIE_NAME = 'wdev255-agent-context';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const MAX_HISTORY = 20;
const MAX_TURNS = 12;

function readCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}

export function loadAgentContext() {
  try {
    const value = readCookie(COOKIE_NAME);
    if (!value) return null;

    const saved = JSON.parse(decodeURIComponent(value));
    return {
      history: Array.isArray(saved.history) ? saved.history.slice(-MAX_HISTORY) : [],
      context: {
        turns: Array.isArray(saved.context?.turns) ? saved.context.turns.slice(-MAX_TURNS) : [],
        lastIntent: saved.context?.lastIntent || null,
        lastTopic: saved.context?.lastTopic || ''
      }
    };
  } catch (_) {
    return null;
  }
}

export function saveAgentContext(state) {
  const payload = {
    history: state.history.slice(-MAX_HISTORY),
    context: {
      turns: state.context.turns.slice(-MAX_TURNS),
      lastIntent: state.context.lastIntent,
      lastTopic: state.context.lastTopic
    }
  };

  try {
    const encoded = encodeURIComponent(JSON.stringify(payload));
    // Keep the cookie below common browser limits and avoid storing secrets/output.
    if (encoded.length > 3800) return false;
    document.cookie = `${COOKIE_NAME}=${encoded}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    return true;
  } catch (_) {
    return false;
  }
}

export function clearAgentContext() {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}
