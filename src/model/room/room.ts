import { WebSocket } from 'ws';
import { IRoom, IRoomPlayer, IShip } from '../types';
import { GameManager } from './battle';

class RoomManager {
  private rooms: IRoom[] = [];
  private nextRoomId = 1;
  private nextPlayerId = 1;
  private nextGameId = 1;

  createRoom(ws: WebSocket): string | number {
    const roomNum = this.nextRoomId++;
    const playerId = this.nextPlayerId++;
    const room: IRoom = {
      roomNum,
      players: [
        { name: 'Player 1', index: playerId, ws, ships: [], password: '', wins: '' },
      ],
    };
    this.rooms.push(room);
    this.broadcastRoomsUpdate();
    return roomNum;
  }

  addUser(ws: WebSocket, roomId: string | number) {
    const room = this.rooms.find(r => r.roomNum === roomId);
    if (!room) return 'Room not found';
    if (room.players.length === 2) return 'Room already full';

    const userInRoom = room.players.some(p => p.ws === ws);
    if (userInRoom) return 'You are already in this room';

    const playerId = this.nextPlayerId++;
    const newPlayer: IRoomPlayer = {
      name: 'Player 2',
      password: '',
      wins: 0,
      index: playerId,
      ws,
      ships: [],
    };
    room.players.push(newPlayer);
    this.broadcastRoomsUpdate();
    if (room.players.length === 2) {
      const gameId = this.nextGameId++;
      return { gameId, players: room.players };
    }
    return roomId;
  }

  addShips(gameId: number, ships: IShip[], playerIndex: number): string | void {
    const generateCoords = (ship: IShip): { x: number; y: number }[] => {
      const coords = [];
      for (let i = 0; i < ship.length; i++) {
        coords.push({
          x: ship.position.x + (ship.direction ? 0 : i),
          y: ship.position.y + (ship.direction ? i : 0),
        });
      }
      return coords;
    };

    const room = this.rooms.find((r) => r.roomNum === gameId);
    if (!room) return 'Room not found';

    if (playerIndex < 0 || playerIndex >= room.players.length) {
      return 'Invalid player index';
    }

    const processedShips = ships.map((ship) => ({
      ...ship,
      coords: generateCoords(ship),
      hits: 0,
    }));
  
    room.players[playerIndex].ships = processedShips;
  
    const allReady = room.players.every((p) => p.ships && p.ships.length > 0);
    if (allReady) {
      this.startGame(room);
    }
  }

  startGame(room: IRoom) {
    const currentPlayerIndex = 0;
    room.gameManager = new GameManager(room.players, currentPlayerIndex);
    room.players.forEach((player) => {
      player.ws.send(JSON.stringify({
        type: 'start_game',
        data: JSON.stringify({
          ships: player.ships,
          currentPlayerIndex,
        }),
        id: 0,
      }));
    });

    this.sendTurn(room, currentPlayerIndex);
  }

  sendTurn(room: IRoom, currentPlayerIndex: number) {
    room.players.forEach(player => {
      player.ws.send(JSON.stringify({
        type: 'turn',
        data: JSON.stringify({
          currentPlayer: currentPlayerIndex,
        }),
        id: 0,
      }));
    });
  }

  getAvailableRooms() {
    return this.rooms
      .filter(r => r.players.length < 2)
      .map(r => ({
        roomId: r.roomNum,
        roomUsers: r.players.map(p => ({ name: p.name }))
      }));
  }

  getRoom(gameId: number): IRoom | undefined {
    return this.rooms.find(r => r.roomNum === gameId);
  }

  broadcastRoomsUpdate() {
    const simplifiedRooms = this.rooms.map(room => ({
      roomId: room.roomNum,
      roomUsers: room.players.map(p => ({ name: p.name }))
    }));
    const message = JSON.stringify({
      type: 'update_room',
      data: JSON.stringify(simplifiedRooms),
      id: 0
    });
    this.broadcastToAll(message);
  }

  broadcastToAll(message: string) {
    this.rooms.forEach(room => {
      room.players.forEach(p => {
        p.ws.send(message);
      });
    });
  }
};

export const roomManager = new RoomManager();
