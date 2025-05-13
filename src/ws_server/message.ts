import { WebSocket } from 'ws';
import { player } from './player';

export const handleMessage = (ws: WebSocket, message: string) => {
  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { errorText: 'Invalid JSON format' },
      id: 0,
    }));
    return;
  }

  if (parsed.type === 'reg') {
    const { name, password } = parsed.data;
    const result = player.register(name, password);

    ws.send(JSON.stringify({
      type: 'reg',
      data: result,
      id: 0,
    }));
  }
};
