const MAX_ISSUES = 6;
const MIN_REQUEST_CONFIDENCE = 0.18;

function normalize(value) {
  return String(value || '').toLocaleLowerCase('it-IT').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function tokens(value) { return new Set(normalize(value).split(' ').filter((token) => token.length > 3)); }
function addIssue(issues, message) { if (issues.length < MAX_ISSUES && !issues.includes(message)) issues.push(message); }
function includesAny(text, values) { return values.some((value) => text.includes(value)); }

/**
 * Classifies the request before output validation. This is deliberately small
 * and local: it uses the same vocabulary as the curated intent dataset and
 * never sends the request to a remote NLP service.
 */
export function classifyRequest(request, decision = {}) {
  const text = normalize(request);
  const scores = {
    html: includesAny(text, ['html', 'pagina web', 'landing', 'markup', 'form html']) ? 1 : 0,
    js: includesAny(text, ['javascript', ' js ', 'codice', 'function', 'funzione', 'array', 'fetch', 'dom']) ? 1 : 0,
    weather: includesAny(text, ['meteo', 'tempo', 'weather', 'temperatura']) ? 1 : 0,
    country: includesAny(text, ['paese', 'nazione', 'country', 'italia', 'japan', 'facts about']) ? 1 : 0,
    wiki: includesAny(text, ['wikipedia', 'wikimedia', 'enciclopedia']) ? 1 : 0,
    navigation: includesAny(text, ['vai', 'apri', 'naviga', 'pagina']) ? 1 : 0,
    conversation: includesAny(text, ['ciao', 'hello', 'grazie', 'help', 'aiuto', 'come']) ? 1 : 0
  };
  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const detected = ranked[0]?.[1] ? ranked[0][0] : 'text';
  const category = decision.category || decision.intent || detected;
  const expectedType = ['html'].includes(category) || detected === 'html' ? 'html'
    : ['js'].includes(category) || detected === 'js' ? 'js'
      : ['weather', 'country', 'wiki'].includes(category) || ['weather', 'country', 'wiki'].includes(detected) ? 'api' : 'text';
  const confidence = Math.max(Number(decision.confidence) || 0, ranked[0]?.[1] ? 0.55 : 0.05);
  const requirements = [];
  if (expectedType === 'html') requirements.push('document');
  if (expectedType === 'js') requirements.push('javascript');
  if (expectedType === 'api') requirements.push('request-data');
  if (includesAny(text, ['form', 'modulo', 'contatto', 'login'])) requirements.push('form');
  if (includesAny(text, ['fetch', 'api', 'meteo', 'weather'])) requirements.push('network');
  if (includesAny(text, ['valida', 'validazione', 'validate'])) requirements.push('validation');
  return {
    category,
    detectedCategory: detected,
    expectedType,
    confidence: Math.min(0.99, confidence),
    requirements,
    ambiguous: ranked[0]?.[1] && ranked[1]?.[1] === ranked[0][1],
    tokens: [...tokens(request)]
  };
}

function balancedJavaScript(source, issues) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = []; let quote = null; let escaped = false; let lineComment = false; let blockComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]; const next = source[index + 1];
    if (lineComment) { if (character === '\n') lineComment = false; continue; }
    if (blockComment) { if (character === '*' && next === '/') { blockComment = false; index += 1; } continue; }
    if (quote) { if (escaped) { escaped = false; continue; } if (character === '\\') { escaped = true; continue; } if (character === quote) quote = null; continue; }
    if (character === '/' && next === '/') { lineComment = true; index += 1; continue; }
    if (character === '/' && next === '*') { blockComment = true; index += 1; continue; }
    if ('"\'`'.includes(character)) { quote = character; continue; }
    if ('([{'.includes(character)) stack.push(character);
    if (pairs[character] && stack.pop() !== pairs[character]) { addIssue(issues, `parentesi JavaScript non bilanciate vicino al carattere ${index}`); return false; }
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
    if (!document.querySelector('main, body')) addIssue(issues, 'HTML privo di contenitore body/main');
  }
  [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].forEach((match) => balancedJavaScript(match[1], issues));
}

function outputMatchesRequest(source, request, profile, issues) {
  const outputText = normalize(source);
  const requestTokens = tokens(request);
  const markers = profile.expectedType === 'html' ? ['html', 'main', 'section', 'script']
    : profile.expectedType === 'js' ? ['function', 'const', 'let', 'document', 'fetch', '=>']
      : profile.expectedType === 'api' ? ['http', 'api', 'meteo', 'wikipedia', 'risultato', 'informazioni'] : [];
  if (markers.length && !markers.some((marker) => outputText.includes(marker))) addIssue(issues, `output ${profile.expectedType} privo di costrutti riconoscibili`);
  if (requestTokens.size >= 3 && ![...requestTokens].some((token) => outputText.includes(token))) addIssue(issues, 'output non sufficientemente contestuale alla richiesta');
}

function selectProfile(type, requestProfile, decision = {}) {
  const expectedType = requestProfile.expectedType === 'text' ? type : requestProfile.expectedType;
  const names = { html: 'html-document', js: 'javascript-code', api: 'public-api-response', text: 'text-response' };
  return { name: names[expectedType] || 'text-response', expectedType, confidence: Math.max(requestProfile.confidence, Number(decision.confidence) || 0) };
}

export function createOutputValidator(state = {}) {
  return {
    classifyRequest,
    validate(output, request, type = 'text', decision = {}) {
      const issues = [];
      const source = String(output || '').trim();
      const requestProfile = classifyRequest(request, decision);
      const profile = selectProfile(type, requestProfile, decision);
      if (requestProfile.confidence < MIN_REQUEST_CONFIDENCE || !requestProfile.tokens.length) addIssue(issues, 'richiesta NLP vuota o non classificabile');
      if (requestProfile.ambiguous && !decision.intent) addIssue(issues, 'richiesta NLP ambigua: specificare il tipo di output');
      if (type !== 'text' && profile.expectedType !== type && requestProfile.confidence >= 0.55) addIssue(issues, `tipo di output incoerente con la richiesta NLP (atteso ${profile.expectedType})`);
      if (!source) addIssue(issues, 'output vuoto');
      if (source.length > 200000) addIssue(issues, 'output oltre il limite di sicurezza');
      if (profile.name === 'html-document') validateHtml(source, issues);
      if (profile.name === 'javascript-code') balancedJavaScript(source, issues);
      if (profile.name === 'html-document' && !/<(?:html|main|section|form|article|body)[\s>]/i.test(source)) addIssue(issues, 'output HTML privo di elementi validi');
      if (profile.name === 'javascript-code' && /<!doctype|<html[\s>]/i.test(source)) addIssue(issues, 'output JavaScript contiene una pagina HTML');
      outputMatchesRequest(source, request, profile, issues);
      const score = Math.max(0, 1 - issues.length * 0.18);
      return { accepted: issues.length === 0, score, issues, type, request, profile, requestProfile, contextTurns: state.context?.turns?.length || 0 };
    },
    rejectMessage(result) {
      return `Output scartato dal secondo agente (${result.profile.name}, NLP ${(result.requestProfile.confidence * 100).toFixed(0)}%, ${(result.score * 100).toFixed(0)}%):\n- ${result.issues.join('\n- ')}\nRiformula la richiesta o specifica meglio il formato desiderato.`;
    }
  };
}