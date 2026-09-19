(() => {
  'use strict';

  const script = document.currentScript;
  const theme = document.createElement('script');
  theme.src = script?.dataset.theme || '../../../res/script/theme.js';
  theme.defer = true;
  theme.dataset.centralTheme = 'true';
  document.head.appendChild(theme);
})();
