import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export default async function globalSetup() {
  // Crear servidor MongoDB en memoria
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Guardar URI para tests individuales
  process.env.MONGO_URI = mongoUri;
  
  // Guardar instancia para teardown
  (global as any).__MONGO_SERVER__ = mongoServer;
  
  // Conectar Mongoose
  await mongoose.connect(mongoUri);
}