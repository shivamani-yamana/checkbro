import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { v4 as uuidv4 } from "uuid";
import { GAME_OVER, INIT_GAME, MOVE, UPDATE_BOARD } from "./messages";

export class Game {
  gameId: string;
  player1: WebSocket;
  player2: WebSocket;
  player1Name: string;
  player2Name: string;
  private board: Chess;
  private startDate: Date;
  isGameOver: boolean = false;

  constructor(
    player1: WebSocket,
    player2: WebSocket,
    player1Name: string,
    player2Name: string
  ) {
    this.gameId = uuidv4();
    this.player1 = player1;
    this.player2 = player2;
    this.player1Name = player1Name;
    this.player2Name = player2Name;
    this.board = new Chess();
    this.startDate = new Date();

    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          color: "white",
        },
      })
    );

    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          gameId: this.gameId,
          color: "black",
        },
      })
    );
  }

  makeMove(
    socket: WebSocket,
    move: { from: string; to: string; promotion?: string | undefined }
  ) {
    const curSize = this.board.history().length % 2;
    // Validate whose move
    if (
      (curSize === 0 && this.player1 !== socket) ||
      (curSize !== 0 && this.player2 !== socket)
    ) {
      // console.log("Invalid move by other player");
      return;
    }

    // Log the move including promotion if it exists
    // console.log("Processing move:", JSON.stringify(move));

    // DO the move
    try {
      // Ensure promotion is properly handled
      const result = this.board.move(move);
      // console.log("Move result:", JSON.stringify(result));
    } catch (e) {
      console.error("Error making move:", e);
      console.error("Attempted move:", JSON.stringify(move));
      return;
    }

    if (this.board.isGameOver()) {
      let winner: string = "";
      let winType: string = "";
      if (this.board.isStalemate()) {
        winner = "draw";
        winType = "stalemate";
      } else if (this.board.isInsufficientMaterial()) {
        winner = "draw";
        winType = "insufficient_material";
      } else if (this.board.isThreefoldRepetition()) {
        winner = "draw";
        winType = "threefold_repitition";
      } else if (this.board.isDrawByFiftyMoves()) {
        winner = "draw";
        winType = "fifty_moves";
      } else if (this.board.isDraw()) {
        winner = "draw";
        winType = "draw";
      } else if (this.board.isCheckmate()) {
        winner = this.board.turn() === "w" ? "black" : "white";
        winType = "checkmate";
      } else if (this.board.isCheck()) {
        console.log("Check", this.board.ascii());
      }

      const gameOverMessage = JSON.stringify({
        type: GAME_OVER,
        payload: {
          winner: winner,
          winType: winType,
        },
      });
      this.player1.send(gameOverMessage);
      this.player2.send(gameOverMessage);
      console.log("Game Over", winner);

      this.isGameOver = true;
    }

    const moveMessage = JSON.stringify({
      type: UPDATE_BOARD,
      payload: {
        board: this.board.fen(),
        move: move,
        history: this.board.history({ verbose: true }),
      },
      // turn:this.board.turn()
    });
    // Send the move to both players

    this.player1.send(moveMessage);
    this.player2.send(moveMessage);
    // console.log("Move made", move);
    // console.log("Current board state", this.board.ascii());
    // console.log("Current turn", this.board.turn());
  }

  /**
   * Returns the complete game state for reconnection
   */
  getGameState() {
    return {
      fen: this.board.fen(),
      moveHistory: this.board.history({ verbose: true }),
      turn: this.board.turn(),
      isGameOver: this.isGameOver,
      inCheck: this.board.isCheck(),
      isCheckmate: this.board.isCheckmate(),
      isDraw: this.board.isDraw(),
      isStalemate: this.board.isStalemate(),
    };
  }
}
