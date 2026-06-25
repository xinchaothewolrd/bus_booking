import { Router } from 'express';
import {
  getAllRouteFares, getRouteFareById, createRouteFare, updateRouteFare, deleteRouteFare
} from '../controllers/routeFareController.js';

const router = Router();

router.get('/', getAllRouteFares);
router.get('/:id', getRouteFareById);
router.post('/', createRouteFare);
router.put('/:id', updateRouteFare);
router.delete('/:id', deleteRouteFare);

export default router;
