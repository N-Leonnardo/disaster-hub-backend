import { getCollection } from '../../services/database.js';

const collection = getCollection('mission');

/**
 * Business logic for mission operations
 * This file contains all business logic related to mission management
 */

export const getAllMissions = async () => {
  return await collection.find({}).toArray();
};

export const getMissionById = async (id) => {
  return await collection.findOne({ _id: id });
};

export const createMission = async (missionData) => {
  const result = await collection.insertOne(missionData);
  return await collection.findOne({ _id: result.insertedId });
};

export const updateMission = async (id, updateData) => {
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result.value;
};

export const deleteMission = async (id) => {
  const result = await collection.findOneAndDelete({ _id: id });
  return result.value;
};
