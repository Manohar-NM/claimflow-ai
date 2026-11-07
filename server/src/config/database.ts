import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDB = async (customUri?: string): Promise<typeof mongoose> => {
  const uri = customUri || config.mongoUri;
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${(error as Error).message}`);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
