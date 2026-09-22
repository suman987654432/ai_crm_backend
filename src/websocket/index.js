import { WebSocketServer } from 'ws';
import { handleNewConnection } from '../services/voice/VoiceSessionService.js';

export const setupWebSocketServer = (server) => {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    
    // Check if the route matches /ws/agent-test/:sessionId
    const match = pathname.match(/^\/ws\/agent-test\/([a-zA-Z0-9-]+)$/);
    
    if (match) {
      const sessionId = match[1];
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, sessionId);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request, sessionId) => {
    console.log(`WebSocket connected for session: ${sessionId}`);
    handleNewConnection(ws, sessionId);
  });
};
