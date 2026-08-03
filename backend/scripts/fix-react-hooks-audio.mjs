import mongoose from 'mongoose';
import 'dotenv/config';
import { synthesize } from '../src/services/ttsService.js';

const LESSON_ID = '6a6e83cb3db3420f2bd74419';
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_teacher';

await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

const Part = mongoose.model('LessonPart', new mongoose.Schema({
  lessonId: mongoose.Schema.Types.ObjectId,
  narration: String,
  partType: String,
  orderIndex: Number,
  audioUrl: String,
}, { strict: false }));

const parts = await Part.find({ lessonId: new mongoose.Types.ObjectId(LESSON_ID) }).sort({ orderIndex: 1 }).lean();
const contentParts = parts.filter((p) => p.partType === 'content' || !p.partType);

let ok = 0;
for (const part of contentParts) {
  if (!part.narration) {
    console.log(`skip part ${part.orderIndex} (no narration)`);
    continue;
  }
  const alreadyDataUrl = (part.audioUrl || '').startsWith('data:');
  if (alreadyDataUrl) {
    console.log(`part ${part.orderIndex}: already data URL, skipping`);
    ok += 1;
    continue;
  }
  try {
    const audio = await synthesize(part.narration, part._id.toString());
    if (!audio || !audio.length) {
      console.log(`part ${part.orderIndex}: TTS returned empty`);
      continue;
    }
    const dataUrl = `data:audio/mpeg;base64,${audio.toString('base64')}`;
    await Part.updateOne({ _id: part._id }, { $set: { audioUrl: dataUrl } });
    ok += 1;
    console.log(`part ${part.orderIndex}: regenerated ${audio.length} bytes → data URL`);
  } catch (err) {
    console.log(`part ${part.orderIndex}: FAILED ${err.message}`);
  }
}
console.log(`done. ${ok}/${contentParts.length} content parts have audio.`);
await mongoose.disconnect();
process.exit(0);
