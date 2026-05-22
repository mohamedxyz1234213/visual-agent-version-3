/**
 * dev-start.js — starts an in-memory MongoDB instance then boots the Express app.
 * Usage: node dev-start.js
 * No local MongoDB installation required.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const mongod = await MongoMemoryServer.create();
const uri = mongod.getUri();

// Inject the URI before the app reads it
process.env.MONGODB_URI = uri;

console.log(`[dev] In-memory MongoDB started: ${uri}`);

// Now boot the full app
await import('./src/index.js');

// Keep the MongoDB server alive for the duration of the process
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
});
