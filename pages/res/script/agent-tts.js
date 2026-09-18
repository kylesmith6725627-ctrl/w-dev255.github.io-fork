import { getConfig } from './agent-storage.js';

const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createTextToSpeech({ state, button, print }) {
  return async function textToSpeech(args) {
    const config = getConfig();
    if (!config.apiKey) return 'Configura prima la chiave: tts-config <API_KEY> [VOICE_ID]. La chiave resta solo nel browser.';

    const voiceId = args[0] || config.voiceId || DEFAULT_VOICE;
    const text = args.slice(1).join(' ').trim();
    if (!text) return 'Uso: tts <voice-id opzionale> "testo da convertire"';
    if (text.length > 5000) return 'Testo troppo lungo: massimo 5000 caratteri.';

    state.busy = true;
    button.disabled = true;
    print('Generazione audio in corso...');
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: 'POST',
        headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      });
      if (!response.ok) throw new Error(`API ${response.status}: ${(await response.text()).slice(0, 180)}`);
      const filename = `wdev255-${new Date().toISOString().replace(/[:.]/g, '-')}.mp3`;
      downloadBlob(await response.blob(), filename);
      return `Audio MP3 scaricato: ${filename}`;
    } catch (error) {
      return `Errore TTS: ${error.message}. Verifica API key, voice ID e CORS.`;
    } finally {
      state.busy = false;
      button.disabled = false;
    }
  };
}
