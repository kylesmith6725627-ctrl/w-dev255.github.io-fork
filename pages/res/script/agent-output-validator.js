const MAX_ISSUES = 6;

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function tokens(value) {
  return new Set(normalize(value).split(' ').filter((token) => token.length > 3));
}

function addIssue(issues, message) {
  if (issues.length < MAX_ISSUES && !issues.includes(message)) issues.push(message);
}

function balancedJavaScript(source, issues) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) { if (character === '\n') lineComment = false; continue; }
    if (blockComment) { if (character === '*' && next === '/') { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (character === quote) quote = null;
      continue;
    }
    if (character === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (character === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if (character === '"' || character === "'" || character === '`') { quote = character; continue; }
    if (character === '(' || character === '[' || character === '{') stack.push(character);
    if (pairs[character] && stack.pop() !== pairs[character]) {
      addIssue(issues, `parentesi JavaScript non bilanciate vicino al carattere ${index}`);
      return false;
    }
  }
  if (quote) addIssue(issues, 'stringa JavaScript non terminata');
  if (blockComment) addIssue(issues, 'commento JavaScript non terminato');
  if (stack.length) addIssue(issues, 'parentesi JavaScript non bilanciate');
  return !quote && !blockComment && !stack.length;
}

function validateHtml(source, issues) {
  if (!/^\s*(?:<!--|<!doctype html|<html[\s>])/i.test(source)) addIssue(issues, 'documento HTML privo di struttura iniziale');
  if (typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(source, 'text/html');
    if (document.querySelector('parsererror')) addIssue(issues, 'parser HTML ha rilevato un errore');
    if (!document.querySelector('main, body')) addIssue(issues, 'HTML privo di contenitore body/main');
  }
  const scripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  scripts.forEach((script) => balancedJavaScript(script, issues));
}

function relevant(source, request, type, issues) {
  const requestTokens = tokens(request);
  const outputText = normalize(source);
  const markers = type === 'html'
    ? ['<html', '<main', '<section', '<script']
    : ['function', 'const ', 'let ', '=>', 'document.', 'fetch('];
  if (!markers.some((marker) => outputText.includes(marker))) addIssue(issues, `output ${type} privo di costrutti ${type === 'html' ? 'HTML/JavaScript' : 'JavaScript'} riconoscibili`);
  const meaningful = [...requestTokens].filter((token) => outputText.includes(token));
  if (requestTokens.size >= 3 && meaningful.length === 0) addIssue(issues, 'output non sufficientemente contestuale alla richiesta');
}

function expectedType(source, type, issues) {
  if (type === 'html' && !/<(?:html|main|section|form|article|body)[\s>]/i.test(source)) addIssue(issues, 'output richiesto come HTML ma non contiene elementi HTML validi');
  if (type === 'js' && /<!doctype|<html[\s>]/i.test(source)) addIssue(issues, 'output richiesto come JavaScript ma contiene una pagina HTML');
}

export function createOutputValidator(state = {}) {
  return {
    validate(output, request, type = 'js') {
      const issues = [];
      const source = String(output || '').trim();
      if (!source) addIssue(issues, 'output vuoto');
      if (source.length > 200000) addIssue(issues, 'output oltre il limite di sicurezza');
      if (type === 'html') validateHtml(source, issues);
      else balancedJavaScript(source, issues);
      expectedType(source, type, issues);
      relevant(source, request, type, issues);
      const score = Math.max(0, 1 - issues.length * 0.18);
      return { accepted: issues.length === 0, score, issues, type, request, contextTurns: state.context?.turns?.length || 0 };
    },
    rejectMessage(result) {
      return `Output scartato dal secondo agente (${result.type}, ${(result.score * 100).toFixed(0)}%):\n- ${result.issues.join('\n- ')}\nRiformula la richiesta o specifica meglio il formato desiderato.`;
    }
  };
}
