import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI not defined in environment');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

export async function dropDatabase(): Promise<void> {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
}
