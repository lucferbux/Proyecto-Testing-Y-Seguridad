import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only-32chars!';
  process.env.NODE_ENV = 'test';

  (global as any).__MONGO_SERVER__ = mongoServer;

  console.log(`\n[Setup] MongoDB Memory Server started at: ${mongoUri}`);
}
