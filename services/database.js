import { getDatabase } from '../util/db.js';

const DB_NAME = 'disasterhub';

export function getCollection(collectionName) {
  const db = getDatabase(DB_NAME);
  return db.collection(collectionName);
}
