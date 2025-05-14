import { WebSocket } from 'ws';

export interface IPlayer {
  name: string;
  password: string;
  wins: number;
  index: number;
  ws?: WebSocket;
}

export interface IRoomPlayer {
  name: string;
  password: string;
  wins: number;
  index: number;
  ws: WebSocket;
  ships: [];
}

export interface IRoom {
  roomNum: string | number;
  players: { name: string; index: string | number; ws: WebSocket;  ships: [] }[];
}

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}
