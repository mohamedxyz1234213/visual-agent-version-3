import 'dotenv/config';
import mongoose from 'mongoose';
import { Lesson } from '../src/models/Lesson.js';

const ids = [
  '6a6e130cd381bb770cf45db9',
  '6a6e1319d381bb770cf45ec3',
  '6a6e1325d381bb770cf46010',
  '6a6e1339d381bb770cf46196',
  '6a6e1361d381bb770cf462df',
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
