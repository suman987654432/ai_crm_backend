import express from 'express';
import * as agentController from '../controllers/agentController.js';

const router = express.Router();

// Apply auth/org middleware here in the future
// router.use(authMiddleware);

router.post('/', agentController.createAgent);
router.get('/', agentController.getAllAgents);
router.get('/:id', agentController.getAgentById);
router.put('/:id', agentController.updateAgent);
router.delete('/:id', agentController.deleteAgent);

// Lifecycle
router.post('/:id/deploy', agentController.deployAgent);

export default router;