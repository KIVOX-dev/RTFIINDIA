import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

export async function connect() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') throw new Error('MONGO_URI is required in production');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const dbPath = path.resolve('.data/mongo');
    fs.mkdirSync(dbPath, { recursive: true });
    const mem = await MongoMemoryServer.create({ instance: { dbPath, port: 27018, storageEngine: 'wiredTiger' } });
    uri = mem.getUri();
    console.log('[db] using embedded MongoDB at', dbPath);
  }
  await mongoose.connect(uri);
}
