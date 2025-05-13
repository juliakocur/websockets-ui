import { IPlayer } from "../model/types";

class Player {
  private players: Map<string, IPlayer> = new Map();
  private nextIndex: number = 1;

  register(name: string, password: string) {
    const playerFromArr = this.players.get(name);

    if (playerFromArr) {
      if (playerFromArr.password !== password) {
        return {
          name: name,
          index: -1,
          error: true,
          errorText: "Wrong password",
        };
      }

      return {
        name: name,
        index: playerFromArr.index,
        error: false,
        errorText: "",
      };
    };

    const newPlayer: IPlayer = {
      name: name,
      password: password,
      wins: 0,
      index: this.nextIndex,
    };

    this.players.set(name, newPlayer);
    this.nextIndex = this.nextIndex + 1;

    return {
      name: name,
      index: newPlayer.index,
      error: false,
      errorText: "",
    };
  };

  getWinners() {
    const winnersList = [];

    for (const player of this.players.values()) {
      winnersList.push({
        name: player.name,
        wins: player.wins,
      });
    }
    return winnersList;
  }
};

export const player = new Player();
