import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();

    app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚀 ClaimFlow AI Server running in ${config.nodeEnv} mode`);
      console.log(`🌐 Server Port: http://localhost:${config.port}`);
      console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`🤖 AI Provider: ${config.aiProvider} (Key present: ${!!config.geminiApiKey || !!config.openaiApiKey})`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
