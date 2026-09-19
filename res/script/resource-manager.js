(() => {
  'use strict';

  const root = new URL('../../', import.meta.url);
  const resources = {
    theme: new URL('res/script/theme.js', root).href,
    agent: new URL('pages/res/script/agent.js', root).href,
    search: new URL('res/script/search.js', root).href,
    quiz: new URL('res/script/quiz.js', root).href,
    retroStyle: new URL('res/style/retro_terminal.css', root).href,
    icon: new URL('res/img/w-dev255_black_icon.jpg', root).href,
    menuAudio: new URL('res/audio/Menu_Full.opus', root).href
  };

  const loaded = new Set();

  function loadScript(url, { module = false } = {}) {
    if (loaded.has(url) || document.querySelector(`script[src="${url}"]`)) return Promise.resolve();
    loaded.add(url);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.defer = true;
      if (module) script.type = 'module';
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', () => reject(new Error(`Unable to load resource: ${url}`)), { once: true });
      document.head.appendChild(script);
    });
  }

  function asset(name) {
    return resources[name] || null;
  }

  window.siteResources = Object.freeze({
    ...resources,
    asset,
    loadScript,
    loadAgent: () => loadScript(resources.agent, { module: true })
  });

  window.siteResources.loadAgent().catch((error) => {
    console.error('[site-resources]', error.message);
  });
})();
