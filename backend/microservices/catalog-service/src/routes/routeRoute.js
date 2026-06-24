import { Router } from 'express';
import {
  getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute
} from '../controllers/routeController.js';

const router = Router();

router.get('/', getAllRoutes);
router.get('/:id', getRouteById);
router.post('/', createRoute);
router.put('/:id', updateRoute);
router.delete('/:id', deleteRoute);

export default router;
