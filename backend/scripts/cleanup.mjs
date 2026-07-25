import mongoose from 'mongoose';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://moodyelfouly:Qeuv4yxcpygCSG4t@cluster0.5ukqxgo.mongodb.net/theteacher?appName=Cluster0';

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const lessons = await db.collection('codinglessons').deleteMany({});
  const exams = await db.collection('exams').deleteMany({});
  const exercises = await db.collection('exercises').deleteMany({});

  console.log(`Deleted ${lessons.deletedCount} lessons`);
  console.log(`Deleted ${exams.deletedCount} exams`);
  console.log(`Deleted ${exercises.deletedCount} exercises`);

  await mongoose.disconnect();
}

cleanup().catch(e => { console.error(e); process.exit(1); });
