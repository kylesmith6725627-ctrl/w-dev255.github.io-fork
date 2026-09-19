(() => {
  'use strict';
  if (document.querySelector('script[data-theme-loader]')) return;
  const theme = document.createElement('script');
  theme.src = '../../../res/script/theme.js';
  theme.dataset.themeLoader = 'true';
  theme.defer = true;
  document.head.appendChild(theme);
})();
