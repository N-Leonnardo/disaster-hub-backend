import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function addDispatchedField() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');

    // Get the database and collection
    const db = client.db('disasterhub');
    const collection = db.collection('incident');

    // Count incidents that don't have the dispatched field
    const incidentsWithoutField = await collection.countDocuments({
      dispatched: { $exists: false }
    });

    console.log(`📊 Found ${incidentsWithoutField} incidents without the 'dispatched' field`);

    if (incidentsWithoutField === 0) {
      console.log('✅ All incidents already have the "dispatched" field!');
      return;
    }

    // Update all incidents that don't have the dispatched field
    const result = await collection.updateMany(
      { dispatched: { $exists: false } },
      { $set: { dispatched: false } }
    );

    console.log(`✅ Updated ${result.modifiedCount} incidents with the 'dispatched' field (set to false)`);
    console.log(`📊 Total incidents in database: ${await collection.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error updating incidents:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the script
addDispatchedField();
