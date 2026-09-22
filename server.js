import http from 'http';
import app from './src/app.js';
import { config } from './src/config/env.js';
import { setupWebSocketServer } from './src/websocket/index.js';

const port = config.port;

const server = http.createServer(app);

// Attach WebSocket Server
setupWebSocketServer(server);

server.listen(port, () => {
	console.log(`Backend server is running on http://localhost:${port}`);
});
