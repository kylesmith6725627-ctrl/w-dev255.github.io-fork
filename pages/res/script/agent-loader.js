(() => {
  'use strict';

  const root = new URL('../../../', import.meta.url);
  const manager = new URL('res/script/resource-manager.js', root).href;
  if (document.querySelector(`script[src="${manager}"]`)) return;

  const script = document.createElement('script');
  script.src = manager;
  script.defer = true;
  script.dataset.resourceManager = 'true';
  document.head.appendChild(script);
})();
