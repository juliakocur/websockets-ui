import { WebSocket } from 'ws';

export interface IPlayer {
    name: string;
    password: string;
    wins: number;
    index: number;
}

export interface IRoom {
  roomNum: string | number;
  players: { name: string; index: string | number; ws: WebSocket }[];
}
