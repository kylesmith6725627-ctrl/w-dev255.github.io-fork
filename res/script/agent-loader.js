(() => {
  'use strict';

  if (document.querySelector('script[data-agent-loader]')) return;

  const current = document.currentScript;
  const loader = document.createElement('script');
  loader.type = 'module';
  loader.dataset.agentLoader = 'true';
  loader.src = current?.dataset.agent || 'pages/res/script/agent.js';
  document.head.appendChild(loader);
})();
