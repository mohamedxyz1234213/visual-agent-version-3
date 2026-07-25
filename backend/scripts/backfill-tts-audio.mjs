// ─── Backfill Speechify TTS Audio for Existing Lessons ──────────────────────
// Finds all LessonPart documents that have narration but no audioUrl,
// generates Speechify TTS audio for each, saves to local audio directory,
// and updates the part with the audio URL.
//
// Run: node scripts/backfill-tts-audio.mjs
// ──────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import mongoose from 'mongoose';

import { synthesize } from '../src/services/ttsService.js';
import { uploadAudio } from '../src/services/storageService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moodyelfouly:Qeuv4yxcpygCSG4t@cluster0.5ukqxgo.mongodb.net/?appName=Cluster0';

// Schema-less read/write via raw collection
async function main() {
  console.log('🔊 Speechify TTS Audio Backfill');
  console.log('────────────────────────────────────\n');

  // 1. Validate Speechify is configured
  if (process.env.TTS_PROVIDER !== 'speechify') {
    console.error('❌ TTS_PROVIDER must be "speechify" in .env');
    process.exit(1);
  }
  if (!process.env.SPEECHIFY_API_KEY) {
    console.error('❌ SPEECHIFY_API_KEY not set');
    process.exit(1);
  }
  console.log(`  TTS_PROVIDER = ${process.env.TTS_PROVIDER}`);
  console.log(`  SPEECHIFY_VOICE_ID = ${process.env.SPEECHIFY_VOICE_ID || 'henry'}\n`);

  // 2. Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log('✅ Connected to MongoDB\n');

  // 3. Find lesson parts with narration but no audioUrl
  const parts = await db.collection('lessonparts')
    .find({
      narration: { $exists: true, $ne: '', $ne: null },
      $or: [
        { audioUrl: { $exists: false } },
        { audioUrl: null },
        { audioUrl: '' },
      ],
    })
    .sort({ lessonId: 1, orderIndex: 1 })
    .toArray();

  console.log(`📊 Found ${parts.length} lesson part(s) needing TTS audio\n`);

  if (parts.length === 0) {
    console.log('✨ Nothing to backfill — all parts already have audio!');
    await mongoose.disconnect();
    return;
  }

  // 4. Process each part
  let success = 0;
  let failed = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const narration = String(part.narration || '').trim();
    const wordCount = narration.split(/\s+/).filter(Boolean).length;

    console.log(`[${i + 1}/${parts.length}] Processing part "${part.title || 'untitled'}" (${wordCount} words)...`);

    if (wordCount < 5) {
      console.log(`  ⏭  Skipped — narration too short (${wordCount} words)\n`);
      continue;
    }

    try {
      // Generate Speechify audio
      const audioBuffer = await synthesize(narration, part._id.toString());
      if (!audioBuffer) {
        console.log(`  ⚠  synthesize() returned null — TTS may not be configured\n`);
        failed++;
        continue;
      }

      // Upload/save audio and get URL (storageService handles both S3 and local)
      const url = await uploadAudio(audioBuffer, part._id.toString());
      if (!url) {
        console.log(`  ⚠  uploadAudio() returned null — cannot store audio\n`);
        failed++;
        continue;
      }

      // Update the part document with the audio URL
      await db.collection('lessonparts').updateOne(
        { _id: part._id },
        { $set: { audioUrl: url } }
      );
      const sizeKb = (audioBuffer.length / 1024).toFixed(1);
      console.log(`  ✅ Audio saved: ${url} (${sizeKb} KB)\n`);
      success++;
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}\n`);
      failed++;
    }
  }

  // 5. Summary
  console.log('═══════════════════════════════════════');
  console.log(`🎯 Backfill complete!`);
  console.log(`   ✅ ${success} part(s) processed successfully`);
  console.log(`   ❌ ${failed} part(s) failed`);
  console.log(`   📊 ${parts.length - success - failed} part(s) skipped`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
