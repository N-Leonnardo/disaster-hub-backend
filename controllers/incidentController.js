import { getCollection } from '../services/database.js';
import { broadcastToClients } from '../services/websocket.js';
import { parseIncidentDescription } from '../services/aiService.js';
import { ObjectId } from 'mongodb';

const collection = getCollection('incident');

// Helper function to convert string ID to ObjectId if needed
function convertToObjectId(id) {
  // If it's already an ObjectId, return as is
  if (id instanceof ObjectId) {
    return id;
  }
  
  // If it's a string and looks like a valid ObjectId (24 hex characters)
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      return new ObjectId(id);
    } catch (error) {
      // If conversion fails, return original string
      return id;
    }
  }
  
  // If not a valid ObjectId format, return as string
  return id;
}

export const getAllIncidents = async (req, res) => {
  try {
    const incidents = await collection.find({}).toArray();
    res.json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = convertToObjectId(id);
    
    // Try both ObjectId and string format
    let incident = await collection.findOne({ _id: objectId });
    if (!incident && objectId !== id) {
      incident = await collection.findOne({ _id: id });
    }
    
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createIncident = async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    const newIncident = await collection.findOne({ _id: result.insertedId });
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'incident_created',
      data: newIncident
    });
    
    res.status(201).json({
      success: true,
      data: newIncident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createIncidentFromText = async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Description is required and must be a non-empty string'
      });
    }

    console.log('[CreateIncidentFromText] Parsing description with AI...');
    
    // Parse the natural language description using AI
    const incidentData = await parseIncidentDescription(description);
    
    console.log('[CreateIncidentFromText] Parsed incident data:', JSON.stringify(incidentData, null, 2));
    
    // Insert into database
    const result = await collection.insertOne(incidentData);
    const newIncident = await collection.findOne({ _id: result.insertedId });
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'incident_created',
      data: newIncident
    });
    
    res.status(201).json({
      success: true,
      data: newIncident,
      message: 'Incident created successfully from description'
    });
  } catch (error) {
    console.error('[CreateIncidentFromText] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create incident from description'
    });
  }
};

export const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[UpdateIncident] Attempting to update incident with ID: ${id} (type: ${typeof id})`);
    
    const objectId = convertToObjectId(id);
    console.log(`[UpdateIncident] Converted ID: ${objectId} (type: ${typeof objectId}, isObjectId: ${objectId instanceof ObjectId})`);
    
    let updatedIncident = null;
    
    // Try ObjectId format first with findOneAndUpdate
    let result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    updatedIncident = result?.value || result;
    
    // If not found and we converted the ID, try the original string format
    if (!updatedIncident && objectId !== id) {
      console.log(`[UpdateIncident] Not found with ObjectId, trying string format: ${id}`);
      result = await collection.findOneAndUpdate(
        { _id: id },
        { $set: req.body },
        { returnDocument: 'after' }
      );
      updatedIncident = result?.value || result;
    }
    
    // If still not found, try using updateOne + findOne as fallback
    if (!updatedIncident) {
      console.log(`[UpdateIncident] Trying updateOne fallback with ObjectId: ${objectId}`);
      const updateResult = await collection.updateOne(
        { _id: objectId },
        { $set: req.body }
      );
      
      if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
        updatedIncident = await collection.findOne({ _id: objectId });
      }
      
      // If still not found, try with string ID
      if (!updatedIncident && objectId !== id) {
        console.log(`[UpdateIncident] Trying updateOne fallback with string: ${id}`);
        const updateResult2 = await collection.updateOne(
          { _id: id },
          { $set: req.body }
        );
        
        if (updateResult2.modifiedCount > 0 || updateResult2.matchedCount > 0) {
          updatedIncident = await collection.findOne({ _id: id });
        }
      }
    }
    
    if (!updatedIncident) {
      console.log(`[UpdateIncident] Incident not found with ID: ${id}`);
      // Try to find what IDs exist (for debugging)
      const sample = await collection.findOne({});
      if (sample) {
        console.log(`[UpdateIncident] Sample incident ID type: ${typeof sample._id}, value: ${sample._id}`);
        console.log(`[UpdateIncident] Sample incident ID string: ${String(sample._id)}`);
      }
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    console.log(`[UpdateIncident] Successfully updated incident: ${updatedIncident._id}`);
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'incident_updated',
      data: updatedIncident
    });
    
    // If dispatched field was set to true, send reload message
    if (req.body.dispatched === true) {
      broadcastToClients({
        type: 'reload',
        reload: true
      });
    }
    
    res.json({
      success: true,
      data: updatedIncident
    });
  } catch (error) {
    console.error(`[UpdateIncident] Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const objectId = convertToObjectId(id);
    
    // Try both ObjectId and string format
    let result = await collection.findOneAndDelete({ _id: objectId });
    let deletedIncident = result?.value || result;
    
    if (!deletedIncident && objectId !== id) {
      result = await collection.findOneAndDelete({ _id: id });
      deletedIncident = result?.value || result;
    }
    
    if (!deletedIncident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'incident_deleted',
      data: { _id: id }
    });
    
    res.json({
      success: true,
      message: 'Incident deleted successfully',
      data: deletedIncident
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
