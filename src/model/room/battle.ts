import { IRoomPlayer, IShip, IAttackResult } from '../types';

export class GameManager {
  private currentPlayerIndex: number;
  private players: IRoomPlayer[];
  private lastAttackResult: 'miss' | 'shot' | 'killed' = 'miss';
  private lastKilledShip: IShip | null = null;
  private lastGameFinished: boolean = false;

  constructor(players: IRoomPlayer[], startingPlayerIndex: number) {
    this.players = players;
    this.currentPlayerIndex = startingPlayerIndex;
  }

  startGame(firstPlayerIndex: number = 0) {
    this.currentPlayerIndex = firstPlayerIndex;
  }

  getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  getLastAttackResult(): 'miss' | 'shot' | 'killed' {
    return this.lastAttackResult;
  }
  
  getLastKilledShip(): IShip | null {
    return this.lastKilledShip;
  }
  
  isGameFinished(): boolean {
    return this.lastGameFinished;
  }

  handleAttack(x: number, y: number): void {
    const opponentIndex = 1 - this.currentPlayerIndex;
    const opponent = this.players[opponentIndex];
  
    this.lastAttackResult = 'miss';
    this.lastKilledShip = null;
    this.lastGameFinished = false;
  
    for (const ship of opponent.ships) {
      const hit = ship.coords.find(c => c.x === x && c.y === y);
      if (hit) {
        ship.hits++;
        this.lastAttackResult = ship.hits >= ship.length ? 'killed' : 'shot';
        if (this.lastAttackResult === 'killed') {
          this.lastKilledShip = ship;
        }
        break;
      }
    }
  
    if (this.lastAttackResult === 'miss') {
      this.currentPlayerIndex = opponentIndex;
    }
  
    const allShipsKilled = opponent.ships.every(ship => ship.hits >= ship.length);
    if (allShipsKilled) {
      this.lastGameFinished = true;
    }
  }
};
