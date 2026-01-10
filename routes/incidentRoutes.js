import express from 'express';
import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  createIncidentFromText,
  updateIncident,
  deleteIncident
} from '../controllers/incidentController.js';

const router = express.Router();

router.get('/', getAllIncidents);
router.post('/from-text', createIncidentFromText);
router.post('/', createIncident);
router.get('/:id', getIncidentById);
router.put('/:id', updateIncident);
router.delete('/:id', deleteIncident);

export default router;
