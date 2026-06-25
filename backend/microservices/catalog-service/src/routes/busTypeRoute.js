import { Router } from 'express';
import {
  getAllBusTypes, getBusTypeById, createBusType, updateBusType, deleteBusType
} from '../controllers/busTypeController.js';

const router = Router();

router.get('/', getAllBusTypes);
router.get('/:id', getBusTypeById);
router.post('/', createBusType);
router.put('/:id', updateBusType);
router.delete('/:id', deleteBusType);

export default router;
