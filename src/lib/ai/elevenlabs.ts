import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const elevenlabs = new ElevenLabsClient({
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

/**
 * Generates a voiceover audio file from text using ElevenLabs
 * Returns the audio as a Buffer
 */
export async function generateVoiceover(
  text: string,
  voiceId: string = '21m00Tcm4TlvDq8ikWAM', // Default voice ID (Rachel)
  modelId: ElevenLabsSpeechModel = 'eleven_multilingual_v2',
  outputFormat: "mp3_44100_128"
): Promise<Buffer> {
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text,
    modelId,
    outputFormat,
  });

  // Convert ReadableStream to Buffer
  const reader = audio.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }

  // Combine all chunks into a single buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return Buffer.from(result);
}



