(() => {
  'use strict';
  const root = new URL('../../', import.meta.url);
  const agent = new URL('pages/res/script/agent.js', root).href;
  if (document.querySelector(`script[src="${agent}"]`)) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = agent;
  script.dataset.agentLoader = 'true';
  document.head.appendChild(script);
})();
