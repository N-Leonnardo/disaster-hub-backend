import dotenv from 'dotenv';
import { connectToMongoDB, closeConnection } from '../util/db.js';
import { createMissionsForIncident } from '../services/missionAgent.js';
import { getCollection } from '../services/database.js';

// Load environment variables
dotenv.config();

async function createMissionsForAllIncidents() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB successfully!');

    // Get the collections using the same pattern as the services
    const incidentCollection = getCollection('incident');
    const missionCollection = getCollection('mission');

    // Get all incidents
    console.log('📊 Fetching all incidents...');
    const allIncidents = await incidentCollection.find({}).toArray();
    console.log(`✅ Found ${allIncidents.length} total incidents`);

    if (allIncidents.length === 0) {
      console.log('⚠️  No incidents found in database');
      return;
    }

    // Get all existing missions to check which incidents already have missions
    console.log('📊 Checking existing missions...');
    const existingMissions = await missionCollection.find({}).toArray();
    console.log(`✅ Found ${existingMissions.length} existing missions`);

    // Create a set of incident IDs that already have missions
    const incidentsWithMissions = new Set(
      existingMissions.map(m => String(m.incident_id))
    );

    console.log('\n🚀 Starting mission creation process...\n');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each incident
    for (let i = 0; i < allIncidents.length; i++) {
      const incident = allIncidents[i];
      const incidentId = String(incident._id);
      
      console.log(`\n[${i + 1}/${allIncidents.length}] Processing incident: ${incidentId}`);
      console.log(`   Type: ${incident.type}`);
      console.log(`   Status: ${incident.status}`);
      console.log(`   Dispatched: ${incident.dispatched || false}`);
      console.log(`   Needs: ${JSON.stringify(incident.needs || [])}`);

      // Check if missions already exist for this incident
      const existingMissionsForIncident = await missionCollection.find({ 
        incident_id: incidentId 
      }).toArray();
      
      if (existingMissionsForIncident.length > 0) {
        console.log(`   ⏭️  Skipping: ${existingMissionsForIncident.length} missions already exist for this incident`);
        skippedCount++;
        continue;
      }

      // Check if incident has needs
      const needs = incident.needs && Array.isArray(incident.needs) && incident.needs.length > 0
        ? incident.needs
        : ['General Response'];

      if (!incident.location) {
        console.log(`   ⚠️  Skipping: Incident has no location`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`   🔨 Creating missions for incident ${incidentId}...`);
        const missions = await createMissionsForIncident(incident);
        console.log(`   ✅ Successfully created ${missions.length} missions`);
        successCount++;
        
        // Update the set to mark this incident as having missions
        incidentsWithMissions.add(incidentId);
      } catch (error) {
        console.error(`   ❌ Error creating missions: ${error.message}`);
        console.error(`   Error stack: ${error.stack}`);
        errorCount++;
        errors.push({
          incidentId: incidentId,
          incidentType: incident.type,
          error: error.message
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MISSION CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully created missions: ${successCount} incidents`);
    console.log(`⏭️  Skipped (already have missions): ${skippedCount} incidents`);
    console.log(`❌ Errors: ${errorCount} incidents`);
    console.log(`📋 Total incidents processed: ${allIncidents.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Incident ${err.incidentId} (${err.incidentType}): ${err.error}`);
      });
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const finalMissionCount = await missionCollection.countDocuments();
    console.log(`✅ Total missions in database: ${finalMissionCount}`);

  } catch (error) {
    console.error('❌ Error creating missions:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  } finally {
    await closeConnection();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the script
createMissionsForAllIncidents();
