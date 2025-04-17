import connectDB from '../config/database';

const testConnection = async () => {
  try {
    await connectDB();
    console.log('Connection to MongoDB Atlas successful!');
  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    process.exit(0);
  }
};

testConnection();