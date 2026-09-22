import { v4 as uuidv4 } from 'uuid';
import { sql } from '../config/database.js';

export const createTestSession = async (req, res, next) => {
  try {
    const agentId = req.params.id;
    
    // Ensure agent exists
    const [agent] = await sql`SELECT * FROM agents WHERE id = ${agentId}`;
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const sessionId = uuidv4();
    
    // The actual DB insert will happen in the VoiceSessionService when the WS connects,
    // but we can initialize the record here for safety if we want.
    // For now, returning the sessionId is enough to tell the browser to connect to the WS.
    
    res.status(201).json({
      success: true,
      data: {
        sessionId,
        agentId,
        wsUrl: `ws://localhost:5000/ws/agent-test/${sessionId}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTestSessions = async (req, res, next) => {
  try {
    const agentId = req.params.id;
    const sessions = await sql`SELECT * FROM agent_test_sessions WHERE agent_id = ${agentId} ORDER BY started_at DESC`;
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

export const endTestSession = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const [ended] = await sql`UPDATE agent_test_sessions SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = ${sessionId} RETURNING *`;
    res.status(200).json({ success: true, data: ended });
  } catch (error) {
    next(error);
  }
};
