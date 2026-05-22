import axios from 'axios';

/**
 * Synthesize narration text to audio bytes.
 * Returns null when TTS is not configured.
 * @param {string} text
 * @param {string} partId
 * @returns {Promise<Buffer|null>}
 */
export async function synthesize(text, partId) {
  const provider = process.env.TTS_PROVIDER || 'none';

  if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    return synthesizeElevenLabs(text);
  }
  if (provider === 'azure' && process.env.AZURE_SPEECH_KEY) {
    return synthesizeAzure(text);
  }
  return null;
}

async function synthesizeElevenLabs(text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const response = await axios.post(
    url,
    { text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
    {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 60000,
    }
  );
  return Buffer.from(response.data);
}

async function synthesizeAzure(text) {
  const region = process.env.AZURE_SPEECH_REGION || 'eastus';
  const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const tokenResp = await axios.post(tokenUrl, null, {
    headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY },
    timeout: 30000,
  });
  const token = tokenResp.data;

  const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='en-US-JennyNeural'>${text}</voice></speak>`;
  const ttsUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const resp = await axios.post(ttsUrl, ssml, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    responseType: 'arraybuffer',
    timeout: 60000,
  });
  return Buffer.from(resp.data);
}
