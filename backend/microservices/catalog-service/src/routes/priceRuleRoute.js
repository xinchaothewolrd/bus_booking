import { Router } from 'express';
import {
  getAllPriceRules, getActivePriceRules, getPriceRuleById, createPriceRule, updatePriceRule, deletePriceRule
} from '../controllers/priceRuleController.js';

const router = Router();

router.get('/', getAllPriceRules);
router.get('/active', getActivePriceRules);
router.get('/:id', getPriceRuleById);
router.post('/', createPriceRule);
router.put('/:id', updatePriceRule);
router.delete('/:id', deletePriceRule);

export default router;
