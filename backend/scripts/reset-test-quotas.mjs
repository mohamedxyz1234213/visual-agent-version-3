import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/auth/models/User.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.updateMany(
    { email: { $in: ['teacher@test.com', 'student@test.com'] } },
    { $set: { maxAiRequests: 100, aiRequestsUsed: 0 } },
  );

  const users = await User.find({ email: { $in: ['teacher@test.com', 'student@test.com'] } })
    .select('email maxAiRequests aiRequestsUsed')
    .lean();

  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
