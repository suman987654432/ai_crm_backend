import express from 'express';
import * as voiceController from '../controllers/voiceController.js';

const router = express.Router();

router.get('/', voiceController.getVoices);
router.post('/preview', voiceController.previewVoice);

export default router;