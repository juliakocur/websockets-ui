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

  incrementWins(name: string) {
    const player = this.players.get(name);
    if (player) {
      player.wins += 1;
      this.players.set(name, player);
    }
  }

  getPlayer(name: string): IPlayer | undefined {
    return this.players.get(name);
  }

  getWinners() {
    const winnersList = [];

    for (const player of this.players.values()) {
      winnersList.push({
        name: player.name,
        wins: player.wins,
      });
    }
    winnersList.sort((a,b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return a.name.localeCompare(b.name);
    });
    return winnersList;
  }
};

export const player = new Player();
