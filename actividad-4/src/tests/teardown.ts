import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalTeardown() {
  const mongoServer: MongoMemoryServer = (global as any).__MONGO_SERVER__;

  if (mongoServer) {
    await mongoServer.stop();
    console.log('\n[Teardown] MongoDB Memory Server stopped');
  }
}
