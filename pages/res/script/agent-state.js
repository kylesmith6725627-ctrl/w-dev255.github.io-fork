export function createAgentState() {
  return {
    history: [],
    output: [],
    prompt: '> ',
    busy: false,
    context: {
      turns: [],
      lastIntent: null,
      lastTopic: ''
    }
  };
}
