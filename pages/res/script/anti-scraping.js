const DEFAULTS = Object.freeze({
  maxSubmissions: 8,
  windowMs: 10_000,
  cooldownMs: 30_000,
});

/**
 * Adds lightweight client-side friction for automated interaction with the
 * agent UI. This is not an access-control boundary: static page assets remain
 * publicly downloadable and determined clients can bypass browser checks.
 */
export function createScrapingGuard({ form, commandArea, onBlocked, options = {} }) {
  const config = { ...DEFAULTS, ...options };
  const submissions = [];
  let blockedUntil = 0;
  let destroyed = false;

  const isAutomatedBrowser = Boolean(
    navigator.webdriver ||
    /HeadlessChrome|PhantomJS|爬虫|bot\b|crawler\b|spider\b/i.test(navigator.userAgent)
  );

  function prune(now) {
    while (submissions.length && submissions[0] <= now - config.windowMs) {
      submissions.shift();
    }
  }

  function block(message) {
    blockedUntil = Date.now() + config.cooldownMs;
    commandArea.setCustomValidity(message);
    commandArea.setAttribute('aria-describedby', 'agent-rate-limit');
    onBlocked?.(message);
  }

  function handleSubmit(event) {
    if (destroyed) return;

    const now = Date.now();
    prune(now);
    if (now < blockedUntil || submissions.length >= config.maxSubmissions) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (now >= blockedUntil) {
        block('Troppi tentativi ravvicinati. Riprova tra poco.');
      } else {
        onBlocked?.('Troppi tentativi ravvicinati. Riprova tra poco.');
      }
      return;
    }

    submissions.push(now);
    commandArea.setCustomValidity('');
  }

  const status = document.createElement('span');
  status.id = 'agent-rate-limit';
  status.className = 'visually-hidden';
  status.setAttribute('aria-live', 'polite');
  form.appendChild(status);

  const reportBlocked = (message) => {
    status.textContent = message;
    onBlocked?.(message);
  };

  // Capture phase prevents automated clients from repeatedly triggering the
  // agent handler while leaving normal keyboard and screen-reader use intact.
  form.addEventListener('submit', handleSubmit, true);

  if (isAutomatedBrowser) {
    reportBlocked('Interazione automatizzata rilevata. Riprova con un browser normale.');
  }

  return {
    isAutomatedBrowser,
    isBlocked() {
      return Date.now() < blockedUntil;
    },
    destroy() {
      destroyed = true;
      form.removeEventListener('submit', handleSubmit, true);
      status.remove();
    },
  };
}
