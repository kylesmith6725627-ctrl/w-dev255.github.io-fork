(() => {
  'use strict';

  if (document.querySelector('script[data-agent-loader]')) return;

  const loader = document.createElement('script');
  loader.type = 'module';
  loader.dataset.agentLoader = 'true';
  loader.src = 'agent.js';
  document.head.appendChild(loader);
})();
