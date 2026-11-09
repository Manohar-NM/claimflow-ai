import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './index.js';
import '../models/index.js'; // Explicitly register all Mongoose models

// Ensure IPv4 resolution priority for robust Atlas SRV record resolution
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in environments where not supported
}

export const connectDB = async (customUri?: string, retries = 2): Promise<typeof mongoose> => {
  const uri = customUri || config.mongoUri;
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[MongoDB] Connected to database: ${conn.connection.name} (host: ${conn.connection.host})`);
      console.log(`[MongoDB] Registered models: ${mongoose.modelNames().join(', ')}`);
      return conn;
    } catch (error) {
      const rawMsg = (error as Error).message || String(error);
      const sanitizedMsg = rawMsg.replace(/\/\/[^:]+:([^@]+)@/g, '//***:***@');
      if (attempt < retries) {
        console.warn(`[MongoDB] Attempt ${attempt} failed: ${sanitizedMsg}. Retrying in 1.5s...`);
        // If DNS SRV had a transient lookup failure, switch to public DNS resolvers
        try {
          dns.setServers(['8.8.8.8', '1.1.1.1']);
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        console.error(`[MongoDB] Connection error: ${sanitizedMsg}`);
        throw new Error(sanitizedMsg);
      }
    }
  }
  throw new Error('[MongoDB] Connection failed after retries');
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

