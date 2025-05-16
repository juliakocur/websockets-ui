import { WebSocket } from 'ws';
import { GameManager } from './room/battle';

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
  wins: number | string;
  index: number;
  ws: WebSocket;
  ships: IShip[];
}

export interface IRoom {
  roomNum: string | number;
  players: IRoomPlayer[];
  gameManager?: GameManager;
}

export interface IShip {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
  coords: { x: number; y: number }[];
  hits: number;
}

export interface IAttackResult {
  result: 'miss' | 'shot' | 'killed';
  currentPlayerIndex: number;
  gameFinished: boolean;
  killedShip: IShip | null;
}
