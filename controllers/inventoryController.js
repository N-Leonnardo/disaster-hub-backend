import { getCollection } from '../services/database.js';

const collection = getCollection('inventory');

export const getAllInventory = async (req, res) => {
  try {
    const items = await collection.find({}).toArray();
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await collection.findOne({ _id: id });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createInventory = async (req, res) => {
  try {
    const result = await collection.insertOne(req.body);
    const newItem = await collection.findOne({ _id: result.insertedId });
    
    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateInventory = async (req, res) => {
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
        error: 'Inventory item not found'
      });
    }
    
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

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.findOneAndDelete({ _id: id });
    
    if (!result.value) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: result.value
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
