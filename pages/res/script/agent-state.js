import { loadAgentContext } from './agent-context-storage.js';

export function createAgentState() {
  const saved = loadAgentContext();
  return {
    history: saved?.history || [],
    output: [],
    prompt: '> ',
    busy: false,
    restored: Boolean(saved),
    context: saved?.context || {
      turns: [],
      lastIntent: null,
      lastTopic: ''
    }
  };
}
