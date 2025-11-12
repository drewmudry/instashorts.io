import { createElevenLabs } from '@ai-sdk/elevenlabs';

export const elevenlabs = createElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
});


export type ElevenLabsSpeechModel =
  | 'eleven_v3'
  | 'eleven_multilingual_v2'
  | 'eleven_flash_v2_5'
  | 'eleven_flash_v2'
  | 'eleven_turbo_v2_5'
  | 'eleven_turbo_v2'
  | 'eleven_monolingual_v1'
  | 'eleven_multilingual_v1';


export const createSpeechModel = (
  modelId: ElevenLabsSpeechModel = 'eleven_multilingual_v2'
) => {
  return elevenlabs.speech(modelId);
};



