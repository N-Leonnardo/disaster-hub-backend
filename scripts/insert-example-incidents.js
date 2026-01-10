import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function insertExampleIncidents() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');

    // Read example incidents from JSON file
    const filePath = join(__dirname, '..', 'example-incidents.json');
    const fileContent = readFileSync(filePath, 'utf8');
    const incidents = JSON.parse(fileContent);

    // Get the database and collection
    const db = client.db('test'); // Change to your database name if different
    const collection = db.collection('incident');

    // Check if incidents already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing incidents in the database.`);
      console.log('   You can either:');
      console.log('   1. Delete existing incidents first');
      console.log('   2. Skip inserting duplicates (recommended)');
    }

    // Insert incidents (skip duplicates based on _id)
    let inserted = 0;
    let skipped = 0;

    for (const incident of incidents) {
      try {
        // Try to insert, but skip if duplicate
        const result = await collection.insertOne(incident);
        if (result.insertedId) {
          inserted++;
          console.log(`✅ Inserted incident: ${incident.type} at [${incident.location.coordinates[1]}, ${incident.location.coordinates[0]}]`);
        }
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error
          skipped++;
          console.log(`⏭️  Skipped duplicate incident: ${incident._id}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Inserted: ${inserted} incidents`);
    console.log(`   ⏭️  Skipped: ${skipped} incidents`);
    console.log(`   📍 Total in database: ${await collection.countDocuments()} incidents`);

  } catch (error) {
    console.error('❌ Error inserting incidents:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the script
insertExampleIncidents();
