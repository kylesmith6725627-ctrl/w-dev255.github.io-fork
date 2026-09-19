import { createChatEngine as createBaseChatEngine } from './agent-chat.js';
import { inferCommunicationProfile, personalize } from './agent-personality.js';

export function createPersonalizedChatEngine(state) {
  const base = createBaseChatEngine(state);
  return { reply(input) {
    const profile = inferCommunicationProfile(input, state.context.turns, state.context.userPreferences);
    state.context.userPreferences = profile;
    const response = base.reply(input);
    response.response = personalize(response.response, profile, response.language);
    return response;
  } };
}
