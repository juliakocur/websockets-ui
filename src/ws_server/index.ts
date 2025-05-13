import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from './message';
import * as http from 'http';

export const wss = new WebSocketServer({ noServer: true });
const clients: WebSocket[] = [];

wss.on('connection', (ws: WebSocket) => {
  clients.push(ws);
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      console.log('Received message:', parsed);
      handleMessage(ws, parsed);
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

export const wsServer = {
  attachTo(server: http.Server) {
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  }
};
