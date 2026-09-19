(() => {
  'use strict';

  const script = document.currentScript;
  const rootTheme = script?.dataset.theme || '../res/script/theme.js';
  const loadTheme = () => {
    if (document.querySelector('script[data-central-theme]')) return;
    const theme = document.createElement('script');
    theme.src = rootTheme;
    theme.defer = true;
    theme.dataset.centralTheme = 'true';
    document.head.appendChild(theme);
  };

  loadTheme();
})();
