import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import agentRoutes from './routes/agentRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import testSessionRoutes from './routes/testSessionRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong', status: 'healthy' });
});

// API Routes
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/voices', voiceRoutes);
app.use('/api/v1', testSessionRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;