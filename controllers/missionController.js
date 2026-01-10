import { getCollection } from '../services/database.js';
import { broadcastToClients } from '../services/websocket.js';

const collection = getCollection('mission');

export const getAllMissions = async (req, res) => {
  try {
    const missions = await collection.find({}).toArray();
    res.json({
      success: true,
      count: missions.length,
      data: missions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getMissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const mission = await collection.findOne({ _id: id });
    
    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    res.json({
      success: true,
      data: mission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createMission = async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    const newMission = await collection.findOne({ _id: result.insertedId });
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'mission_created',
      data: newMission
    });
    
    res.status(201).json({
      success: true,
      data: newMission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateMission = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.findOneAndUpdate(
      { _id: id },
      { $set: req.body },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'mission_updated',
      data: result.value
    });
    
    res.json({
      success: true,
      data: result.value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteMission = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.findOneAndDelete({ _id: id });
    
    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'mission_deleted',
      data: { _id: id }
    });
    
    res.json({
      success: true,
      message: 'Mission deleted successfully',
      data: result.value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
