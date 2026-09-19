(() => {
  'use strict';

  const theme = {
    green: '#00c853',
    dimGreen: '#087f3c',
    muted: '#8bd9a8',
    black: '#000',
    white: '#fff',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
  };

  const setStyles = (element, styles) => Object.assign(element.style, styles);

  function applyTheme() {
    document.documentElement.style.colorScheme = 'dark';
    setStyles(document.body, {
      boxSizing: 'border-box',
      margin: '0',
      minHeight: '100vh',
      padding: 'clamp(1rem, 4vw, 2rem)',
      backgroundColor: theme.black,
      color: theme.green,
      fontFamily: theme.mono,
      lineHeight: '1.5',
      border: `3px solid ${theme.dimGreen}`
    });

    document.querySelectorAll('*').forEach((element) => {
      element.style.boxSizing = 'border-box';
    });

    document.querySelectorAll('a').forEach((link) => {
      setStyles(link, { color: theme.green, fontFamily: theme.mono });
      link.addEventListener('mouseenter', () => { link.style.color = theme.white; });
      link.addEventListener('mouseleave', () => { link.style.color = theme.green; });
    });

    document.querySelectorAll('.retro, .section, .retro_box').forEach((box) => {
      setStyles(box, {
        border: `3px solid ${theme.green}`,
        padding: '1rem',
        marginBottom: '1.5rem'
      });
    });

    document.querySelectorAll('h1, h2, h3').forEach((heading) => {
      setStyles(heading, { color: theme.green, fontFamily: theme.mono, letterSpacing: '.08em' });
    });

    document.querySelectorAll('p, label, th, td, caption, small').forEach((element) => {
      setStyles(element, { color: theme.green, fontFamily: theme.mono });
    });

    document.querySelectorAll('p').forEach((paragraph) => {
      paragraph.style.lineHeight = '1.4';
    });

    document.querySelectorAll('table').forEach((table) => {
      setStyles(table, {
        border: `3px solid ${theme.green}`,
        marginBottom: '1.125rem',
        borderCollapse: 'collapse',
        maxWidth: '100%'
      });
    });

    document.querySelectorAll('th, td, caption').forEach((cell) => {
      setStyles(cell, { border: `3px solid ${theme.green}`, padding: '6px' });
    });

    document.querySelectorAll('button, input, textarea, select').forEach((control) => {
      setStyles(control, {
        fontFamily: theme.mono,
        backgroundColor: theme.black,
        color: theme.green,
        border: `2px solid ${theme.green}`,
        padding: '6px',
        maxWidth: '100%'
      });
      control.addEventListener('focus', () => { control.style.outline = `2px dashed ${theme.white}`; });
      control.addEventListener('blur', () => { control.style.outline = ''; });
    });

    document.querySelectorAll('img').forEach((image) => {
      image.style.maxWidth = '100%';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
  } else {
    applyTheme();
  }
})();
