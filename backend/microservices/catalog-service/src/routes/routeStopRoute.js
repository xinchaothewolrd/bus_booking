import { Router } from 'express';
import {
  getRouteStops, getRouteStopById, createRouteStop, updateRouteStop, deleteRouteStop
} from '../controllers/routeStopController.js';

const router = Router();

router.get('/', getRouteStops);
router.get('/:id', getRouteStopById);
router.post('/', createRouteStop);
router.put('/:id', updateRouteStop);
router.delete('/:id', deleteRouteStop);

export default router;
