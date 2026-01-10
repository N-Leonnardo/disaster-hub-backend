import { getCollection } from '../../services/database.js';

const collection = getCollection('volunteer');

/**
 * Business logic for volunteer operations
 * This file contains all business logic related to volunteer management
 */

export const getAllVolunteers = async () => {
  return await collection.find({}).toArray();
};

export const getVolunteerById = async (id) => {
  return await collection.findOne({ _id: id });
};

export const createVolunteer = async (volunteerData) => {
  const result = await collection.insertOne(volunteerData);
  return await collection.findOne({ _id: result.insertedId });
};

export const updateVolunteer = async (id, updateData) => {
  const result = await collection.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { returnDocument: 'after' }
  );
  return result.value;
};

export const deleteVolunteer = async (id) => {
  const result = await collection.findOneAndDelete({ _id: id });
  return result.value;
};
