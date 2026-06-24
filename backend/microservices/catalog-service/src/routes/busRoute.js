import { Router } from 'express';
import {
  getAllBuses, getBusById, createBus, updateBus, deleteBus
} from '../controllers/busController.js';

const router = Router();

router.get('/', getAllBuses);
router.get('/:id', getBusById);
router.post('/', createBus);
router.put('/:id', updateBus);
router.delete('/:id', deleteBus);

export default router;
