import 'dotenv/config';
import mongoose from 'mongoose';
import { Lesson } from '../src/models/Lesson.js';

const ids = [
  '6a6e69978c5473dd58153f3f',
  '6a6e69a38c5473dd5815405c',
  '6a6e69af8c5473dd58154171',
  '6a6e69bf8c5473dd58154341',
  '6a6e69cb8c5473dd581544f7',
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const rows = await Lesson.find({ _id: { $in: ids } })
    .select('_id title status processingStep')
    .lean();
  console.log(JSON.stringify(rows, null, 2));
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
