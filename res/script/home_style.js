(() => {
  'use strict';
  const style = (element, values) => Object.assign(element.style, values);
  const green = '#00c853';
  const muted = '#8bd9a8';
  const black = '#000';
  const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const apply = () => {
    style(document.body, { margin: '0', minHeight: '100vh', padding: 'clamp(1rem, 4vw, 2rem)', backgroundColor: black, color: green, fontFamily: mono, lineHeight: '1.5', border: '3px solid #087f3c' });
    const header = document.querySelector('.site-header');
    const main = document.querySelector('main');
    const social = document.querySelector('.social-links');
    [header, main, social].filter(Boolean).forEach((element) => style(element, { width: 'min(100%, 58rem)', marginInline: 'auto' }));
    if (header) style(header, { display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '3rem' });
    document.querySelectorAll('a').forEach((link) => { link.style.color = green; link.addEventListener('mouseenter', () => { link.style.color = '#fff'; }); link.addEventListener('mouseleave', () => { link.style.color = green; }); });
    document.querySelectorAll('.icon').forEach((image) => style(image, { display: 'block', width: '5rem', height: '5rem', objectFit: 'cover', border: `2px solid ${green}` }));
    document.querySelectorAll('.eyebrow, .welcome p, .retro_box small').forEach((element) => { element.style.color = muted; });
    const welcome = document.querySelector('.welcome');
    if (welcome) style(welcome, { borderLeft: `3px solid ${green}`, padding: '.25rem 1rem', marginBottom: '2rem' });
    const box = document.querySelector('.retro_box');
    if (box) style(box, { border: `3px solid ${green}`, padding: '1rem', maxWidth: '32rem' });
    document.querySelectorAll('input, button').forEach((control) => style(control, { border: `2px solid ${green}`, backgroundColor: black, color: green, font: 'inherit', minHeight: '2.5rem', padding: '.35rem .75rem' }));
    if (social) style(social, { display: 'flex', flexWrap: 'wrap', gap: '1rem 1.5rem', marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #087f3c' });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
