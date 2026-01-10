import { getCollection } from '../services/database.js';
import { broadcastToClients } from '../services/websocket.js';

const collection = getCollection('volunteer');

export const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await collection.find({}).toArray();
    res.json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getVolunteerById = async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = await collection.findOne({ _id: id });
    
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }
    
    res.json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createVolunteer = async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    const newVolunteer = await collection.findOne({ _id: result.insertedId });
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'volunteer_created',
      data: newVolunteer
    });
    
    res.status(201).json({
      success: true,
      data: newVolunteer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateVolunteer = async (req, res) => {
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
        error: 'Volunteer not found'
      });
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'volunteer_updated',
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

export const deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.findOneAndDelete({ _id: id });
    
    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }
    
    // Broadcast to WebSocket clients
    broadcastToClients({
      type: 'volunteer_deleted',
      data: { _id: id }
    });
    
    res.json({
      success: true,
      message: 'Volunteer deleted successfully',
      data: result.value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
