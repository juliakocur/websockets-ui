import { WebSocket } from 'ws';
import { player } from './player';
import { roomManager } from '../model/room/room';

export const handleMessage = (ws: WebSocket, message: string) => {
  let parsed;

  try {
    parsed = JSON.parse(message);
    if (typeof parsed.data === 'string' && parsed.data !== '') {
      try {
        parsed.data = JSON.parse(parsed.data);
      } catch (innerErr) {
        console.error("Invalid nested JSON in 'data':", parsed.data);
        ws.send(JSON.stringify({
          type: 'error',
          data: JSON.stringify({ errorText: 'Invalid JSON in message.data' }),
          id: parsed.id ?? 0,
        }));
        return;
      }
    }
  } catch (err) {
    console.error("Error parsing JSON:", message);
    ws.send(JSON.stringify({
      type: 'error',
      data: JSON.stringify({ errorText: 'Invalid JSON format' }),
      id: 0,
    }));
    return;
  }

  const { type, data, id = 0 } = parsed;

  if (type === 'reg') {
    const { name, password } = data;
    const result = player.register(name, password);
    ws.send(JSON.stringify({
      type: 'reg',
      data: JSON.stringify(result),
      id,
    }));
    const rooms = roomManager.getAvailableRooms();
    ws.send(JSON.stringify({
      type: 'update_room',
      data: JSON.stringify(rooms),
      id,
    }));
    return;
  }

  if (type === 'create_room') {
    roomManager.createRoom(ws);
    return;
  }

  if (type === 'add_user_to_room') {
    const { indexRoom } = data;
    const result = roomManager.addUser(ws, indexRoom);
    if (typeof result === 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        data: JSON.stringify({ errorText: result }),
        id,
      }));
    } else if (typeof result === 'object' && 'gameId' in result) {
      const { gameId, players } = result;
      players.forEach((playerWs, idx) => {
        playerWs.ws.send(JSON.stringify({
          type: 'create_game',
          data: JSON.stringify({
            idGame: gameId,
            idPlayer: idx,
          }),
          id,
        }));
      });
    }
    return;
  }

  if (type === 'get_rooms') {
    const rooms = roomManager.getAvailableRooms();
    ws.send(JSON.stringify({
      type: 'update_room',
      data: JSON.stringify(rooms),
      id,
    }));
    return;
  }

  if (type === 'add_ships') { 
    const { gameId, ships, indexPlayer } = data;
    roomManager.addShips(gameId, ships as [], indexPlayer);
    return;
  }

  if (type === 'single_play') {
    ws.send(JSON.stringify({
      type: 'error',
      data: JSON.stringify({ errorText: 'Single play not implemented' }),
      id,
    }));
    return;
  }
  ws.send(JSON.stringify({
    type: 'error',
    data: JSON.stringify({ errorText: `Unknown message type: ${type}` }),
    id,
  }));
};
