import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined in .env file');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Connection pool options
  maxPoolSize: 10,
  minPoolSize: 1,
  // Connection timeout options
  connectTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  serverSelectionTimeoutMS: 30000, // 30 seconds
  // Retry options
  retryWrites: true,
  retryReads: true,
  // Heartbeat options
  heartbeatFrequencyMS: 10000,
});

// Export a function to get a database instance
export function getDatabase(dbName = 'test') {
  return client.db(dbName);
}

// Export a function to connect to MongoDB
export async function connectToMongoDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', uri ? `${uri.substring(0, 20)}...` : 'NOT SET');
    
    await client.connect();
    
    // Verify connection by pinging the database
    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB successfully!');
    console.log('MongoDB connection verified with ping command.');
    
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    console.error('Error details:');
    console.error('- Error name:', error.name);
    console.error('- Error message:', error.message);
    
    if (error.message && error.message.includes('timeout')) {
      console.error('\n⚠️  Connection timeout. Possible issues:');
      console.error('1. Check if MongoDB Atlas cluster is running and accessible');
      console.error('2. Verify IP whitelist in MongoDB Atlas includes your Docker container IP');
      console.error('3. Check network connectivity from Docker container to MongoDB Atlas');
      console.error('4. Verify MONGODB_URI in .env file is correct');
    }
    
    if (error.message && error.message.includes('authentication')) {
      console.error('\n⚠️  Authentication failed. Check:');
      console.error('1. MongoDB username and password in connection string');
      console.error('2. Database user permissions in MongoDB Atlas');
    }
    
    throw error;
  }
}

// Export a function to close the connection
export async function closeConnection() {
  try {
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}
