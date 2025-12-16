import mongoose from 'mongoose';

export default async function globalTeardown() {
  // Desconectar Mongoose
  await mongoose.disconnect();
  
  // Parar servidor MongoDB
  const mongoServer = (global as any).__MONGO_SERVER__;
  if (mongoServer) {
    await mongoServer.stop();
  }
}