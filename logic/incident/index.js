import { getCollection } from '../../services/database.js';

const collection = getCollection('incident');

/**
 * Business logic for incident operations
 * This file contains all business logic related to incident management
 */

export const getAllIncidents = async () => {
  return await collection.find({}).toArray();
};

export const getIncidentById = async (id) => {
  return await collection.findOne({ _id: id });
};

export const createIncident = async (incidentData) => {
  const result = await collection.insertOne(incidentData);
  return await collection.findOne({ _id: result.insertedId });
};

export const updateIncident = async (id, updateData) => {
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result.value;
};

export const deleteIncident = async (id) => {
  const result = await collection.findOneAndDelete({ _id: id });
  return result.value;
};
