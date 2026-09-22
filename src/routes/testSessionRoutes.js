import express from 'express';
import * as testSessionController from '../controllers/testSessionController.js';

const router = express.Router();

// Endpoints for managing agent test sessions
router.post('/agents/:id/test-session', testSessionController.createTestSession);
router.get('/agents/:id/test-sessions', testSessionController.getTestSessions);
router.post('/test-sessions/:sessionId/end', testSessionController.endTestSession);

export default router;
