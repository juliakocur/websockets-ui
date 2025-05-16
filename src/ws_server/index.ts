import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from './message';
import { httpServer } from "../http_server/index";

const HTTP_PORT = 8181;
const WS_PORT = 3000;

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server started on http://localhost:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: WS_PORT });
const clients: WebSocket[] = [];

wss.on('connection', (ws: WebSocket) => {
  clients.push(ws);
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      console.log('Received raw message:', message.toString());
      handleMessage(ws, message.toString());
    } catch (err) {
      console.error('Error', err);
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Invalid JSON',
        id: 0,
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is running on ws://localhost:${WS_PORT}`);
