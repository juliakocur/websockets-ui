import { WebSocket } from 'ws';
import { IRoom } from '../types';

class RoomManager {
    private rooms: IRoom[] = [];
    private nextRoomId = 1;
    private nextPlayerId = 1;

    createRoom(ws: WebSocket): string | number {
      const roomNum = this.nextRoomId++;
      const playerId = this.nextPlayerId++;
  
      const room: IRoom = {
        roomNum,
        players: [
          { name: 'Player 1', index: playerId, ws },
        ],
      };
  
      this.rooms.push(room);
      return roomNum;
    }
};
  
export const roomManager = new RoomManager();
