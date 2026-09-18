(() => {
  'use strict';

  const green = '#00c853';
  const dimGreen = '#087f3c';
  const muted = '#8bd9a8';
  const black = '#000';
  const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  const setStyles = (element, styles) => Object.assign(element.style, styles);

  const styleSite = () => {
    setStyles(document.documentElement, { colorScheme: 'dark' });
    setStyles(document.body, {
      boxSizing: 'border-box',
      margin: '0',
      minHeight: '100vh',
      padding: 'clamp(1rem, 4vw, 2rem)',
      backgroundColor: black,
      color: green,
      fontFamily: mono,
      lineHeight: '1.5',
      border: `3px solid ${dimGreen}`
    });

    document.querySelectorAll('*').forEach((element) => {
      element.style.boxSizing = 'border-box';
    });

    document.querySelectorAll('a').forEach((link) => {
      setStyles(link, { color: green });
      link.addEventListener('mouseenter', () => { link.style.color = '#fff'; });
      link.addEventListener('mouseleave', () => { link.style.color = green; });
    });

    document.querySelectorAll('.retro, .section, .retro_box').forEach((box) => {
      setStyles(box, { border: `3px solid ${green}`, padding: '1rem', marginBottom: '1.5rem' });
    });

    document.querySelectorAll('h1, h2').forEach((heading) => {
      setStyles(heading, { letterSpacing: '.08em' });
    });

    document.querySelectorAll('p, h1, h2, h3, a, th, td, caption, label').forEach((element) => {
      element.style.fontFamily = mono;
      element.style.color = green;
    });

    document.querySelectorAll('p').forEach((paragraph) => {
      paragraph.style.lineHeight = '1.4';
    });

    document.querySelectorAll('table').forEach((table) => {
      setStyles(table, { border: `3px solid ${green}`, padding: '6px', marginBottom: '18px', borderCollapse: 'collapse' });
    });

    document.querySelectorAll('th, td, caption').forEach((cell) => {
      setStyles(cell, { border: `3px solid ${green}`, padding: '6px' });
    });

    document.querySelectorAll('button, input, textarea').forEach((control) => {
      setStyles(control, { fontFamily: mono, backgroundColor: black, color: green, border: `2px solid ${green}`, padding: '6px' });
      control.addEventListener('focus', () => { control.style.outline = '2px dashed #fff'; });
      control.addEventListener('blur', () => { control.style.outline = ''; });
    });

    document.querySelectorAll('img').forEach((image) => {
      image.style.maxWidth = '100%';
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', styleSite);
  else styleSite();
})();
