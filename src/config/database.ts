import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const cluster = process.env.MONGODB_CLUSTER;
    const dbName = process.env.MONGODB_DB_NAME;
    
    if (!username || !password || !cluster) {
      throw new Error('MongoDB configuration is incomplete');
    }
    
    const mongoURI = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=hungnm`;
    
    await mongoose.connect(mongoURI, {
      dbName: dbName || 'smart-agriculture'
    });
    
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
