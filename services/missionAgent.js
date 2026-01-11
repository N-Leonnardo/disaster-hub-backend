import { getCollection } from './database.js';
import { broadcastToClients } from './websocket.js';
import { ObjectId } from 'mongodb';
import OpenAI from 'openai';

// Initialize OpenAI client for Fireworks.ai
const aiClient = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

// Get collections - will be initialized when database is connected
function getMissionCollection() {
  return getCollection('mission');
}

function getIncidentCollection() {
  return getCollection('incident');
}

/**
 * Mission Agent - Automatically creates missions when an incident is dispatched
 * Creates one mission per need/resource required by the incident
 */

/**
 * Generate a unique mission ID
 */
function generateMissionId() {
  const id = `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('[Mission Agent] Generated mission ID:', id);
  return id;
}

/**
 * Determine priority based on incident type and status
 */
function determinePriority(incident) {
  const highPriorityTypes = ['Fire', 'Medical Emergency', 'Building Collapse', 'Gas Leak', 'Chemical Spill'];
  const mediumPriorityTypes = ['Power Outage', 'Flood', 'Earthquake', 'Bridge Collapse'];
  
  console.log('[Mission Agent] Determining priority for incident type:', incident.type);
  
  if (highPriorityTypes.includes(incident.type)) {
    console.log('[Mission Agent] Priority: High (high priority incident type)');
    return 'High';
  } else if (mediumPriorityTypes.includes(incident.type)) {
    console.log('[Mission Agent] Priority: Medium (medium priority incident type)');
    return 'Medium';
  } else if (incident.status === 'Active') {
    console.log('[Mission Agent] Priority: High (active status)');
    return 'High';
  } else {
    console.log('[Mission Agent] Priority: Medium (default)');
    return 'Medium';
  }
}

/**
 * Use AI to enhance mission description and generate better details
 * @param {Object} incident - The incident
 * @param {string} need - The specific need/resource for this mission
 * @returns {Promise<Object>} - Enhanced mission details with AI-generated description and reasoning
 */
async function enhanceMissionWithAI(incident, need) {
  try {
    console.log('[Mission Agent] 🤖 Using AI to enhance mission for need:', need);
    
    const prompt = `You are an emergency response coordinator. Generate a detailed mission description and reasoning for a ${need} mission related to a ${incident.type} incident.

Incident Details:
- Type: ${incident.type}
- Status: ${incident.status}
- Description: ${incident.description || 'No additional details'}
- Location: ${incident.location ? `Coordinates: ${incident.location.coordinates}` : 'Unknown'}

Required Resource/Need: ${need}

Generate:
1. A detailed mission description (2-3 sentences)
2. Reasoning for why this mission is important
3. Confidence score (0.0-1.0) for mission relevance

Return a JSON object with: description, reasoning, confidence_score`;

    const response = await aiClient.chat.completions.create({
      model: "accounts/fireworks/models/deepseek-v3p1",
      messages: [
        {
          role: "system",
          content: "You are an emergency response coordinator. Generate detailed mission descriptions and reasoning in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_object"
      },
      temperature: 0.7,
      max_tokens: 300
    });

    const aiResponse = JSON.parse(response.choices[0].message.content);
    console.log('[Mission Agent] ✅ AI enhancement received:', aiResponse);
    
    return {
      description: aiResponse.description || `Provide ${need} support for ${incident.type} incident. ${incident.description || 'No additional details.'}`,
      reasoning: aiResponse.reasoning || `Auto-generated mission for "${need}" resource based on incident needs.`,
      confidence_score: aiResponse.confidence_score || 0.85
    };
  } catch (error) {
    console.error('[Mission Agent] ⚠️  AI enhancement failed, using default:', error.message);
    // Return default values if AI fails
    return {
      description: `Provide ${need} support for ${incident.type} incident. ${incident.description || 'No additional details.'}`,
      reasoning: `Auto-generated mission for "${need}" resource based on incident needs. Incident type: ${incident.type}`,
      confidence_score: 0.75
    };
  }
}

/**
 * Create missions for a dispatched incident
 * @param {Object} incident - The incident that was dispatched
 * @returns {Promise<Array>} - Array of created missions
 */
export async function createMissionsForIncident(incident) {
  // Get collections inside the function to ensure database is connected
  const missionCollection = getMissionCollection();
  const incidentCollection = getIncidentCollection();
  
  try {
    console.log('[Mission Agent] ========================================');
    console.log('[Mission Agent] START: Creating missions for dispatched incident');
    console.log('[Mission Agent] Incident ID:', incident._id);
    console.log('[Mission Agent] Incident ID type:', typeof incident._id);
    console.log('[Mission Agent] Incident Type:', incident.type);
    console.log('[Mission Agent] Incident Status:', incident.status);
    console.log('[Mission Agent] Incident Dispatched:', incident.dispatched);
    console.log('[Mission Agent] Incident Needs:', incident.needs);
    console.log('[Mission Agent] Incident Location:', JSON.stringify(incident.location));
    
    // Verify database connection and write capability
    console.log('[Mission Agent] Verifying database connection...');
    try {
      // Test database connection by counting documents
      const testCount = await missionCollection.countDocuments();
      console.log('[Mission Agent] ✅ Database connection verified. Current mission count:', testCount);
      
      // Test that we can query the collection
      const testQuery = await missionCollection.find({}).limit(1).toArray();
      console.log('[Mission Agent] ✅ Collection query test successful. Sample count:', testQuery.length);
      
      // Verify collection name and database
      const dbName = missionCollection.dbName;
      const collName = missionCollection.collectionName;
      console.log('[Mission Agent] Collection info:', {
        database: dbName,
        collection: collName
      });
    } catch (dbError) {
      console.error('[Mission Agent] ❌ Database connection error:', dbError);
      console.error('[Mission Agent] Database error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      throw new Error(`Database connection failed: ${dbError.message}`);
    }
    
    // Check if missions already exist for this incident
    console.log('[Mission Agent] Checking for existing missions...');
    const incidentIdStr = String(incident._id);
    console.log('[Mission Agent] Query: { incident_id: ', incidentIdStr, ' }');
    console.log('[Mission Agent] Incident _id type:', typeof incident._id);
    console.log('[Mission Agent] Incident _id value:', incident._id);
    
    // Final query for existing missions
    let existingMissions = [];
    try {
      existingMissions = await missionCollection.find({ incident_id: incidentIdStr }).toArray();
      console.log(`[Mission Agent] Found ${existingMissions.length} existing missions for incident ${incidentIdStr}`);
    } catch (finalQueryError) {
      console.error('[Mission Agent] ❌ Error in query for existing missions:', finalQueryError);
      console.error('[Mission Agent] Query error details:', {
        name: finalQueryError.name,
        message: finalQueryError.message,
        code: finalQueryError.code
      });
      existingMissions = [];
    }
    
    if (existingMissions.length > 0) {
      console.log(`[Mission Agent] ⚠️  Missions already exist for incident ${incident._id}, skipping creation`);
      console.log('[Mission Agent] Existing missions:', existingMissions.map(m => ({ id: m._id, name: m.name })));
      return existingMissions;
    }

    const needs = incident.needs && Array.isArray(incident.needs) && incident.needs.length > 0
      ? incident.needs
      : ['General Response']; // Default need if none specified

    console.log('[Mission Agent] Needs to create missions for:', needs);
    console.log('[Mission Agent] Needs count:', needs.length);

    const priority = determinePriority(incident);
    console.log('[Mission Agent] Determined priority:', priority);
    
    const now = new Date().toISOString();
    console.log('[Mission Agent] Creation timestamp:', now);
    
    const createdMissions = [];

    // Create one mission per need/resource
    for (let i = 0; i < needs.length; i++) {
      const need = needs[i];
      console.log(`[Mission Agent] --- Creating mission ${i + 1}/${needs.length} for need: "${need}" ---`);
      
      // Ensure incident_id is stored as string for consistency
      const incidentId = String(incident._id);
      console.log('[Mission Agent] Storing incident_id as:', incidentId, '(type:', typeof incidentId, ')');
      
      // Check if a mission with this name and incident_id already exists (prevent duplicates)
      const missionName = `${need} - ${incident.type} Incident`;
      const existingMission = await missionCollection.findOne({ 
        incident_id: incidentId,
        name: missionName
      });
      
      if (existingMission) {
        console.log(`[Mission Agent] ⚠️  Mission "${missionName}" already exists for incident ${incidentId}, skipping`);
        console.log('[Mission Agent] Existing mission ID:', existingMission._id);
        createdMissions.push(existingMission);
        continue; // Skip to next need
      }
      
      const missionId = generateMissionId();
      console.log('[Mission Agent] Generated mission ID:', missionId);
      
      // Use AI to enhance mission description
      console.log('[Mission Agent] 🤖 Calling AI to enhance mission details...');
      const aiEnhanced = await enhanceMissionWithAI(incident, need);
      console.log('[Mission Agent] ✅ AI enhancement complete');
      
      const missionData = {
        _id: missionId,
        incident_id: incidentId, // Store as string for consistency
        volunteer_id: null, // Will be assigned later
        assigned_resources: [],
        workflow_step: 'Created',
        priority: priority,
        comms_channel: `Incident_${incidentId.substring(0, 8)}`,
        location: incident.location, // Use incident location - includes type: "Point" and coordinates [lng, lat]
        name: missionName,
        description: aiEnhanced.description,
        status: 'Pending',
        timeline: {
          created_at: now,
          eoc_approved_at: null,
          volunteer_accepted_at: null,
          completed_at: null
        },
        ai_metadata: {
          confidence_score: aiEnhanced.confidence_score,
          match_reasoning: aiEnhanced.reasoning
        }
      };

      console.log('[Mission Agent] Mission data to insert:', JSON.stringify(missionData, null, 2));
      console.log('[Mission Agent] Location data:', JSON.stringify(missionData.location));

      // Insert mission with explicit write concern
      console.log('[Mission Agent] Inserting mission into database...');
      console.log('[Mission Agent] Database collection name: mission');
      console.log('[Mission Agent] Mission data _id type:', typeof missionData._id);
      console.log('[Mission Agent] Mission data _id value:', missionData._id);
      console.log('[Mission Agent] Full mission data:', JSON.stringify(missionData, null, 2));
      
      // Declare newMission outside try block so it's accessible after
      let newMission = null;
      
      try {
        // First, try without write concern to see if basic insert works
        console.log('[Mission Agent] Attempting insertOne...');
        let result;
        
        try {
          // Try with write concern first (for replica sets)
          result = await missionCollection.insertOne(missionData, {
            writeConcern: { w: 1, wtimeout: 5000 }
          });
        } catch (writeConcernError) {
          console.log('[Mission Agent] ⚠️  Write concern failed, trying without write concern:', writeConcernError.message);
          // Fallback: try without write concern (for standalone MongoDB)
          result = await missionCollection.insertOne(missionData);
        }
        
        console.log('[Mission Agent] Insert result:', {
          insertedId: result.insertedId,
          insertedIdType: typeof result.insertedId,
          insertedIdString: String(result.insertedId),
          acknowledged: result.acknowledged,
          insertedCount: result.insertedCount,
          hasInsertedId: !!result.insertedId
        });
        
        if (!result.acknowledged) {
          console.error('[Mission Agent] ❌ ERROR: Insert was not acknowledged by database!');
          throw new Error('Mission insert was not acknowledged');
        }
        
        // Check if we have an insertedId (more reliable than insertedCount)
        if (!result.insertedId) {
          console.error('[Mission Agent] ❌ ERROR: Insert was acknowledged but no insertedId returned!');
          throw new Error('Mission insert acknowledged but no insertedId returned');
        }
        
        // Only check insertedCount if it exists (some MongoDB versions don't include it)
        if (result.insertedCount !== undefined && result.insertedCount !== 1) {
          console.error('[Mission Agent] ❌ ERROR: Expected 1 insert, got:', result.insertedCount);
          throw new Error(`Expected 1 insert, got ${result.insertedCount}`);
        }
        
        // Wait a brief moment to ensure write is committed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('[Mission Agent] Mission inserted successfully, retrieving from database...');
        console.log('[Mission Agent] Inserted ID from result:', result.insertedId);
        console.log('[Mission Agent] Inserted ID type:', typeof result.insertedId);
        console.log('[Mission Agent] Inserted ID string:', String(result.insertedId));
        console.log('[Mission Agent] Original missionId:', missionId);
        console.log('[Mission Agent] MissionId type:', typeof missionId);
        
        // The insertedId should match our missionId (custom string)
        // Try finding by the original missionId first (most reliable)
        newMission = await missionCollection.findOne({ _id: missionId });
        console.log('[Mission Agent] Query result by original missionId:', newMission ? 'FOUND' : 'NOT FOUND');
        
        if (!newMission) {
          console.log('[Mission Agent] ⚠️  Not found by original missionId, trying by insertedId...');
          newMission = await missionCollection.findOne({ _id: result.insertedId });
          console.log('[Mission Agent] Query result by insertedId:', newMission ? 'FOUND' : 'NOT FOUND');
        }
        
        if (!newMission) {
          console.log('[Mission Agent] ⚠️  Not found by _id, trying by incident_id...');
          const missionsByIncident = await missionCollection.find({ incident_id: incidentIdStr }).toArray();
          console.log('[Mission Agent] Missions found by incident_id:', missionsByIncident.length);
          if (missionsByIncident.length > 0) {
            console.log('[Mission Agent] Mission IDs found:', missionsByIncident.map(m => m._id));
            // Find the one we just created (should be the most recent or match by name)
            newMission = missionsByIncident.find(m => m.name === missionData.name) || missionsByIncident[missionsByIncident.length - 1];
            console.log('[Mission Agent] Found mission by incident_id:', newMission?._id);
          }
        }
        
        // If still not found, try without _id filter (find by name and incident_id)
        if (!newMission) {
          console.log('[Mission Agent] ⚠️  Trying to find by name and incident_id...');
          newMission = await missionCollection.findOne({ 
            name: missionData.name,
            incident_id: incidentIdStr
          });
          console.log('[Mission Agent] Query result by name+incident_id:', newMission ? 'FOUND' : 'NOT FOUND');
        }
        
        // Last resort: try to find ANY mission with this name
        if (!newMission) {
          console.log('[Mission Agent] ⚠️  Last resort: trying to find by name only...');
          const missionsByName = await missionCollection.find({ name: missionData.name }).toArray();
          console.log('[Mission Agent] Missions found by name:', missionsByName.length);
          if (missionsByName.length > 0) {
            newMission = missionsByName[missionsByName.length - 1];
            console.log('[Mission Agent] Found mission by name:', newMission?._id);
          }
        }
        
        console.log('[Mission Agent] Retrieved mission from database:', {
          found: !!newMission,
          id: newMission?._id,
          name: newMission?.name,
          incident_id: newMission?.incident_id,
          location: newMission?.location
        });
        
        if (!newMission) {
          console.error('[Mission Agent] ❌ ERROR: Mission was inserted but could not be retrieved!');
          console.error('[Mission Agent] Inserted ID was:', result.insertedId);
          console.error('[Mission Agent] Original mission ID was:', missionId);
          console.error('[Mission Agent] Mission data that was inserted:', JSON.stringify(missionData, null, 2));
          
          // Try to list all missions to see what's in the database
          const allMissions = await missionCollection.find({}).limit(10).toArray();
          console.log('[Mission Agent] Sample missions in database:', allMissions.map(m => ({ 
            id: m._id, 
            name: m.name,
            incident_id: m.incident_id 
          })));
          
          // Count total missions
          const totalCount = await missionCollection.countDocuments();
          console.log('[Mission Agent] Total missions in database:', totalCount);
          
          throw new Error(`Failed to retrieve created mission with ID: ${result.insertedId}`);
        }
      } catch (insertError) {
        console.error('[Mission Agent] ❌ ERROR during mission insert:', insertError);
        console.error('[Mission Agent] Insert error name:', insertError.name);
        console.error('[Mission Agent] Insert error message:', insertError.message);
        console.error('[Mission Agent] Insert error code:', insertError.code);
        console.error('[Mission Agent] Insert error stack:', insertError.stack);
        
        // Check if it's a duplicate key error
        if (insertError.code === 11000 || insertError.codeName === 'DuplicateKey') {
          console.error('[Mission Agent] ⚠️  Duplicate key error - mission with this _id may already exist');
          // Try to find the existing mission
          const existing = await missionCollection.findOne({ _id: missionId });
          if (existing) {
            console.log('[Mission Agent] Found existing mission with same _id:', existing._id);
            return [existing]; // Return the existing mission
          }
        }
        
        throw insertError;
      }
      
      // Safety check: ensure newMission exists before using it
      if (!newMission) {
        console.error('[Mission Agent] ❌ ERROR: newMission is null or undefined after insert!');
        throw new Error('Mission was inserted but could not be retrieved');
      }
      
      createdMissions.push(newMission);
      console.log('[Mission Agent] ✅ Mission successfully created and added to array');
      
      // Broadcast mission creation
      console.log('[Mission Agent] Broadcasting mission_created message...');
      try {
        broadcastToClients({
          type: 'mission_created',
          data: newMission
        });
        console.log('[Mission Agent] ✅ Mission created and broadcast:', newMission._id);
      } catch (broadcastError) {
        console.error('[Mission Agent] ⚠️  Error broadcasting mission (non-fatal):', broadcastError);
        // Don't fail if broadcast fails
      }
    }

    console.log(`[Mission Agent] ✅ Successfully created ${createdMissions.length} missions for incident ${incident._id}`);
    console.log('[Mission Agent] Created mission IDs:', createdMissions.map(m => m._id));
    
    // Log ALL created missions with full details
    console.log('\n[Mission Agent] ========================================');
    console.log('[Mission Agent] 📋 ALL CREATED MISSIONS:');
    console.log('[Mission Agent] ========================================');
    createdMissions.forEach((mission, index) => {
      console.log(`\n[Mission Agent] Mission ${index + 1}/${createdMissions.length}:`);
      console.log('[Mission Agent]   _id:', mission._id);
      console.log('[Mission Agent]   name:', mission.name);
      console.log('[Mission Agent]   incident_id:', mission.incident_id);
      console.log('[Mission Agent]   description:', mission.description);
      console.log('[Mission Agent]   priority:', mission.priority);
      console.log('[Mission Agent]   status:', mission.status);
      console.log('[Mission Agent]   workflow_step:', mission.workflow_step);
      console.log('[Mission Agent]   location:', JSON.stringify(mission.location));
      console.log('[Mission Agent]   comms_channel:', mission.comms_channel);
      console.log('[Mission Agent]   timeline:', JSON.stringify(mission.timeline));
      console.log('[Mission Agent]   ai_metadata:', JSON.stringify(mission.ai_metadata));
      console.log('[Mission Agent]   volunteer_id:', mission.volunteer_id);
      console.log('[Mission Agent]   assigned_resources:', JSON.stringify(mission.assigned_resources));
    });
    console.log('\n[Mission Agent] ========================================');
    
    // Final verification: Query database to confirm missions exist
    console.log('[Mission Agent] Performing final verification...');
    // incidentIdStr is already declared earlier in the function
    const verifyMissions = await missionCollection.find({ incident_id: incidentIdStr }).toArray();
    console.log(`[Mission Agent] Verification: Found ${verifyMissions.length} missions in database for incident ${incidentIdStr}`);
    
    // Log ALL missions found in database
    console.log('\n[Mission Agent] ========================================');
    console.log('[Mission Agent] 📋 ALL MISSIONS IN DATABASE FOR THIS INCIDENT:');
    console.log('[Mission Agent] ========================================');
    verifyMissions.forEach((mission, index) => {
      console.log(`\n[Mission Agent] Database Mission ${index + 1}/${verifyMissions.length}:`);
      console.log('[Mission Agent]   _id:', mission._id);
      console.log('[Mission Agent]   name:', mission.name);
      console.log('[Mission Agent]   incident_id:', mission.incident_id);
      console.log('[Mission Agent]   description:', mission.description);
      console.log('[Mission Agent]   priority:', mission.priority);
      console.log('[Mission Agent]   status:', mission.status);
      console.log('[Mission Agent]   workflow_step:', mission.workflow_step);
      console.log('[Mission Agent]   location:', JSON.stringify(mission.location));
      console.log('[Mission Agent]   comms_channel:', mission.comms_channel);
      console.log('[Mission Agent]   timeline:', JSON.stringify(mission.timeline));
      console.log('[Mission Agent]   ai_metadata:', JSON.stringify(mission.ai_metadata));
      console.log('[Mission Agent]   volunteer_id:', mission.volunteer_id);
      console.log('[Mission Agent]   assigned_resources:', JSON.stringify(mission.assigned_resources));
    });
    console.log('\n[Mission Agent] ========================================');
    
    if (verifyMissions.length !== createdMissions.length) {
      console.error(`[Mission Agent] ⚠️  WARNING: Created ${createdMissions.length} missions but found ${verifyMissions.length} in database!`);
      console.error('[Mission Agent] Created mission IDs:', createdMissions.map(m => m._id));
      console.error('[Mission Agent] Database mission IDs:', verifyMissions.map(m => m._id));
    } else {
      console.log('[Mission Agent] ✅ Verification passed: All missions are in database');
    }
    
    // Broadcast reload message to refresh all data
    console.log('[Mission Agent] Broadcasting reload message...');
    broadcastToClients({
      type: 'reload',
      reload: true
    });
    console.log('[Mission Agent] Reload message broadcast complete');
    console.log('[Mission Agent] ========================================');

    return createdMissions;
  } catch (error) {
    console.error('[Mission Agent] ❌ ERROR creating missions:', error);
    console.error('[Mission Agent] Error stack:', error.stack);
    console.error('[Mission Agent] Incident that failed:', {
      id: incident._id,
      type: incident.type,
      needs: incident.needs
    });
    throw error;
  }
}

/**
 * Check if an incident was just dispatched and create missions
 * @param {Object} incident - The updated incident
 * @param {Object} previousState - The previous state of the incident (optional)
 * @returns {Promise<Array>} - Array of created missions or empty array
 */
export async function handleIncidentDispatch(incident, previousState = null) {
  try {
    console.log('[Mission Agent] ========================================');
    console.log('[Mission Agent] handleIncidentDispatch called');
    console.log('[Mission Agent] Current incident dispatched:', incident.dispatched);
    console.log('[Mission Agent] Previous state:', previousState ? {
      dispatched: previousState.dispatched,
      id: previousState._id
    } : 'null (no previous state)');
    
    // Check if incident was just dispatched (dispatched changed from false to true)
    const wasJustDispatched = incident.dispatched === true && 
                              (!previousState || previousState.dispatched !== true);

    console.log('[Mission Agent] Was just dispatched?', wasJustDispatched);
    console.log('[Mission Agent] Condition check:', {
      'incident.dispatched === true': incident.dispatched === true,
      'previousState exists': !!previousState,
      'previousState.dispatched !== true': previousState ? previousState.dispatched !== true : 'N/A (no previous state)'
    });

    if (wasJustDispatched) {
      console.log(`[Mission Agent] ✅ Incident ${incident._id} was just dispatched, creating missions...`);
      const missions = await createMissionsForIncident(incident);
      console.log(`[Mission Agent] ✅ Returned ${missions.length} missions from createMissionsForIncident`);
      
      // Log all returned missions
      console.log('\n[Mission Agent] ========================================');
      console.log('[Mission Agent] 📋 ALL RETURNED MISSIONS FROM handleIncidentDispatch:');
      console.log('[Mission Agent] ========================================');
      missions.forEach((mission, index) => {
        console.log(`\n[Mission Agent] Returned Mission ${index + 1}/${missions.length}:`);
        console.log('[Mission Agent]   _id:', mission._id);
        console.log('[Mission Agent]   name:', mission.name);
        console.log('[Mission Agent]   incident_id:', mission.incident_id);
        console.log('[Mission Agent]   Full mission:', JSON.stringify(mission, null, 2));
      });
      console.log('\n[Mission Agent] ========================================');
      
      return missions;
    } else {
      console.log(`[Mission Agent] ⏭️  Incident ${incident._id} was not just dispatched, skipping mission creation`);
      if (incident.dispatched !== true) {
        console.log('[Mission Agent] Reason: incident.dispatched is not true');
      } else if (previousState && previousState.dispatched === true) {
        console.log('[Mission Agent] Reason: incident was already dispatched previously');
      }
    }

    return [];
  } catch (error) {
    console.error('[Mission Agent] ❌ ERROR handling incident dispatch:', error);
    console.error('[Mission Agent] Error message:', error.message);
    console.error('[Mission Agent] Error stack:', error.stack);
    return [];
  }
}

/**
 * Background Mission Agent - Actively monitors and creates missions
 * Periodically checks for incidents that need missions and creates them
 */
let missionAgentInterval = null;
let isAgentRunning = false;

/**
 * Check all incidents and create missions for those that need them
 * @returns {Promise<Object>} - Summary of missions created
 */
export async function checkAndCreateMissions() {
  if (isAgentRunning) {
    console.log('[Mission Agent Background] ⏭️  Agent already running, skipping this cycle');
    return { skipped: true };
  }

  isAgentRunning = true;
  const startTime = Date.now();
  
  try {
    console.log('[Mission Agent Background] ========================================');
    console.log('[Mission Agent Background] 🔍 Starting active mission check...');
    
    const incidentCollection = getIncidentCollection();
    const missionCollection = getMissionCollection();
    
    // Get all incidents
    const allIncidents = await incidentCollection.find({}).toArray();
    console.log(`[Mission Agent Background] Found ${allIncidents.length} total incidents`);
    
    if (allIncidents.length === 0) {
      console.log('[Mission Agent Background] No incidents found');
      return { checked: 0, created: 0, skipped: 0 };
    }

    let checked = 0;
    let created = 0;
    let skipped = 0;
    const errors = [];

    // Check each incident
    for (const incident of allIncidents) {
      checked++;
      const incidentId = String(incident._id);
      
      try {
        // Check if incident has needs
        const needs = incident.needs && Array.isArray(incident.needs) && incident.needs.length > 0
          ? incident.needs
          : ['General Response'];

        if (!incident.location) {
          console.log(`[Mission Agent Background] ⚠️  Incident ${incidentId} has no location, skipping`);
          skipped++;
          continue;
        }

        // Check if missions already exist for this incident
        const existingMissions = await missionCollection.find({ incident_id: incidentId }).toArray();
        
        if (existingMissions.length > 0) {
          // Missions already exist, skip
          console.log(`[Mission Agent Background] ⚠️  Incident ${incidentId} already has ${existingMissions.length} missions, skipping`);
          skipped++;
          continue;
        }
        
        // Additional check: verify we're not creating missions for an incident that was just processed
        // by checking if any mission with the same needs exists
        // (needs is already declared above, so we reuse it)
        
        // Check if missions for all needs already exist
        let allMissionsExist = true;
        for (const need of needs) {
          const missionName = `${need} - ${incident.type} Incident`;
          const missionExists = await missionCollection.findOne({
            incident_id: incidentId,
            name: missionName
          });
          if (!missionExists) {
            allMissionsExist = false;
            break;
          }
        }
        
        if (allMissionsExist) {
          console.log(`[Mission Agent Background] ⚠️  All missions for incident ${incidentId} already exist, skipping`);
          skipped++;
          continue;
        }

        // Check if incident should have missions (dispatched or has needs)
        // Create missions if:
        // 1. Incident is dispatched, OR
        // 2. Incident has needs (even if not dispatched yet)
        const shouldCreateMissions = incident.dispatched === true || 
                                     (needs.length > 0 && needs[0] !== 'General Response');

        if (!shouldCreateMissions) {
          skipped++;
          continue;
        }

        console.log(`[Mission Agent Background] ✅ Creating missions for incident ${incidentId} (${incident.type})`);
        console.log(`[Mission Agent Background]   Needs: ${JSON.stringify(needs)}`);
        console.log(`[Mission Agent Background]   Dispatched: ${incident.dispatched || false}`);

        // Create missions for this incident
        const missions = await createMissionsForIncident(incident);
        created += missions.length;
        
        console.log(`[Mission Agent Background] ✅ Created ${missions.length} missions for incident ${incidentId}`);
      } catch (error) {
        console.error(`[Mission Agent Background] ❌ Error processing incident ${incidentId}:`, error.message);
        errors.push({
          incidentId: incidentId,
          error: error.message
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log('[Mission Agent Background] ========================================');
    console.log('[Mission Agent Background] 📊 Summary:');
    console.log(`[Mission Agent Background]   Checked: ${checked} incidents`);
    console.log(`[Mission Agent Background]   Created: ${created} missions`);
    console.log(`[Mission Agent Background]   Skipped: ${skipped} incidents`);
    console.log(`[Mission Agent Background]   Errors: ${errors.length}`);
    console.log(`[Mission Agent Background]   Duration: ${duration}ms`);
    
    if (errors.length > 0) {
      console.log('[Mission Agent Background] ❌ Errors:');
      errors.forEach(err => {
        console.log(`[Mission Agent Background]   - Incident ${err.incidentId}: ${err.error}`);
      });
    }
    
    console.log('[Mission Agent Background] ========================================');

    return {
      checked,
      created,
      skipped,
      errors: errors.length,
      duration
    };
  } catch (error) {
    console.error('[Mission Agent Background] ❌ Fatal error in background agent:', error);
    console.error('[Mission Agent Background] Error stack:', error.stack);
    return {
      error: error.message
    };
  } finally {
    isAgentRunning = false;
  }
}

/**
 * Start the background mission agent
 * @param {number} intervalMs - Interval in milliseconds (default: 5 minutes)
 */
export function startMissionAgent(intervalMs = 5 * 60 * 1000) {
  if (missionAgentInterval) {
    console.log('[Mission Agent Background] ⚠️  Agent already started');
    return;
  }

  console.log(`[Mission Agent Background] 🚀 Starting background mission agent (checking every ${intervalMs / 1000 / 60} minutes)`);
  
  // Run immediately on start
  checkAndCreateMissions().catch(err => {
    console.error('[Mission Agent Background] Error in initial check:', err);
  });

  // Then run periodically
  missionAgentInterval = setInterval(() => {
    checkAndCreateMissions().catch(err => {
      console.error('[Mission Agent Background] Error in periodic check:', err);
    });
  }, intervalMs);

  console.log('[Mission Agent Background] ✅ Background agent started');
}

/**
 * Stop the background mission agent
 */
export function stopMissionAgent() {
  if (missionAgentInterval) {
    clearInterval(missionAgentInterval);
    missionAgentInterval = null;
    isAgentRunning = false;
    console.log('[Mission Agent Background] 🛑 Background agent stopped');
  }
}
