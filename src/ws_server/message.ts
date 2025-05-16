import { WebSocket } from 'ws';
import { player } from './player';
import { roomManager } from '../model/room/room';
import { IShip } from '../model/types';

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

  if (type === 'attack') {
    const { gameId, x, y, indexPlayer } = data;
    const room = roomManager.getRoom(gameId);
    if (!room || !room.gameManager) return;
  
    const game = room.gameManager;
  
    if (indexPlayer !== game.getCurrentPlayerIndex()) {
      ws.send(JSON.stringify({
        type: 'error',
        data: JSON.stringify({ errorText: 'Not your turn' }),
        id,
      }));
      return;
    }

    if (indexPlayer === 1 - game.getCurrentPlayerIndex()) {
      ws.send(JSON.stringify({
        type: 'error',
        data: JSON.stringify({ errorText: 'Attack yourself' }),
        id,
      }));
      return;
    }

      
    game.handleAttack(x, y);
  
    const result = game.getLastAttackResult();
    const killedShip = game.getLastKilledShip();
    const gameFinished = game.isGameFinished();
    const currentPlayer = game.getCurrentPlayerIndex();

    room.players.forEach(p => {
      p.ws.send(JSON.stringify({
        type: 'attack',
        data: JSON.stringify({
          position: { x, y },
          currentPlayer: indexPlayer,
          status: result,
        }),
        id,
      }));
    });
  
    function getCellsAroundShip(ship: IShip): { x: number; y: number }[] {
      const set = new Set<string>();
      for (const coord of ship.coords) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const x = coord.x + dx;
            const y = coord.y + dy;
            if (x >= 0 && x < 10 && y >= 0 && y < 10) {
              const key = `${x},${y}`;
              if (!ship.coords.some(c => c.x === x && c.y === y)) {
                set.add(key);
              }
            }
          }
        }
      }
      return Array.from(set).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
      });
    }
  
    if (result === 'killed' && killedShip) {
      const around = getCellsAroundShip(killedShip);
      for (const cell of around) {
        room.players.forEach(p => {
          p.ws.send(JSON.stringify({
            type: 'attack',
            data: JSON.stringify({
              position: { x: cell.x, y: cell.y },
              currentPlayer: indexPlayer,
              status: 'miss',
            }),
            id,
          }));
        });
      }
    }

    if (result === 'miss') {
      room.players.forEach(p => {
        p.ws.send(JSON.stringify({
          type: 'turn',
          data: JSON.stringify({
            currentPlayer: game.getCurrentPlayerIndex(),
          }),
          id,
        }));
      });
    }
    
  
    if (gameFinished) {
      room.players.forEach(p => {
        p.ws.send(JSON.stringify({
          type: 'finish',
          data: JSON.stringify({
            winPlayer: indexPlayer
          }),
          id,
        }));
      });
    }
  
    return;
  }

  // if (type === 'randomAttack') {
  //   const { gameId, indexPlayer } = data;
  //   const x = Math.floor(Math.random() * 10);
  //   const y = Math.floor(Math.random() * 10);

  //   return;
  // }

  ws.send(JSON.stringify({
    type: 'error',
    data: JSON.stringify({ errorText: `Unknown message type: ${type}` }),
    id,
  }));
};
