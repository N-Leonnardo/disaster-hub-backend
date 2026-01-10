import { getCollection } from '../../services/database.js';

const collection = getCollection('inventory');

/**
 * Business logic for inventory operations
 * This file contains all business logic related to inventory management
 */

export const getAllInventoryItems = async () => {
  return await collection.find({}).toArray();
};

export const getInventoryItemById = async (id) => {
  return await collection.findOne({ _id: id });
};

export const createInventoryItem = async (itemData) => {
  const result = await collection.insertOne(itemData);
  return await collection.findOne({ _id: result.insertedId });
};

export const updateInventoryItem = async (id, updateData) => {
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result.value;
};

export const deleteInventoryItem = async (id) => {
  const result = await collection.findOneAndDelete({ _id: id });
  return result.value;
};
