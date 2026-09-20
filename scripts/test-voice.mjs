// Checks your ElevenLabs key from .env.local. Never prints the key.
import fs from 'fs';
import { synthesize, ttsConfig } from '../lib/tts.mjs';

try {
  for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  console.log('No .env.local found. Create it in the project folder and add ELEVENLABS_API_KEY=your_key');
  process.exit(1);
}

const cfg = ttsConfig();
if (!cfg.key) { console.log('ELEVENLABS_API_KEY is empty in .env.local'); process.exit(1); }
console.log('Key found (' + cfg.key.length + ' characters). Voice ' + cfg.voice + ', model ' + cfg.model + '.');

const started = Date.now();
const r = await synthesize('Stop. Do not send this. Call your bank using the number on your card.', cfg);
if (!r.ok) {
  console.log('FAILED: ' + r.reason + ' (HTTP ' + r.status + ').');
  if (r.reason === 'provider_error') console.log('Check that the key was copied fully, has Text to Speech permission, and the account has credits.');
  process.exit(1);
}
const out = new URL('../voice-test.mp3', import.meta.url);
fs.writeFileSync(out, Buffer.from(r.audio));
console.log('OK: got ' + r.audio.byteLength + ' bytes of audio in ' + (Date.now() - started) + ' ms.');
console.log('Saved to voice-test.mp3 in the project folder. Open it to listen, then delete it.');
