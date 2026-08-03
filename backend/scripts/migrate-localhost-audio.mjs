import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// ─── Migrate localhost-based audio URLs into MongoDB base64 data URLs ───────
// Root cause: older lessons stored narration audio as an absolute
// `http://localhost:PORT/audio/file.mp3` URL in the lessonpart. That only
// resolves on the machine+process that generated it. From the deployed Vercel
// frontend (or any other browser) `localhost` points at the *viewer*'s computer,
// so no audio plays.
//
// Fix: read the bytes of that local file and store them inline in MongoDB as a
// `data:audio/mpeg;base64,...` URL — the same representation uploadAudio()
// already produces on Vercel. Audio then travels with the document and plays
// from anywhere.
//
// Run:  node scripts/migrate-localhost-audio.mjs
// ─────────────────────────────────────────────────────────────────────────────

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_teacher';
await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
const db = mongoose.connection.db;
const parts = db.collection('lessonparts');

// Locate the backend public/audio dir on this machine.
const rel = path.resolve(process.cwd(), 'public', 'audio');
const audioDir = fs.existsSync(rel) ? rel : null;

if (!audioDir) {
  console.error('public/audio does not exist at', rel);
  process.exit(1);
}

const candidates = await parts.find({ audioUrl: /^http:\/\/localhost/ }).toArray();
console.log(`parts with localhost audio URLs: ${candidates.length}`);

let ok = 0, skipped = 0, failed = 0;
for (const part of candidates) {
  const url = part.audioUrl || '';
  const m = url.match(/\/audio\/([^/]+\.mp3)$/);
  if (!m) { skipped++; continue; }
  const filename = m[1];
  const full = path.join(audioDir, filename);
  if (!fs.existsSync(full)) {
    console.log(`  ✗ missing file ${filename} (${part._id})`);
    failed++; continue;
  }
  const buffer = fs.readFileSync(full);
  if (!buffer.length) { console.log(`  ✗ empty file ${filename}`); failed++; continue; }
  const dataUrl = `data:audio/mpeg;base64,${buffer.toString('base64')}`;
  await parts.updateOne({ _id: part._id }, { $set: { audioUrl: dataUrl } });
  ok++;
  const kb = Math.round(buffer.length / 1024);
  console.log(`  ✓ ${filename} → ${kb} KB data URL (part ${part._id})`);
}

console.log(`\nmigrated: ${ok}, skipped: ${skipped}, failed: ${failed}`);
await mongoose.disconnect();
process.exit(0);