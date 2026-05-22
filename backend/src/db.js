import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_teacher';
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    tls: uri.startsWith('mongodb+srv'),
  });
  console.log('MongoDB connected:', uri.replace(/\/\/.*@/, '//***@'));
}
