"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const messages_1 = require("./messages");
class Game {
    constructor(player1, player2) {
        this.isGameOver = false;
        this.player1 = player1;
        this.player2 = player2;
        this.board = new chess_js_1.Chess();
        this.startDate = new Date();
        this.player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "white",
            },
        }));
        this.player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "black",
            },
        }));
    }
    makeMove(socket, move) {
        const curSize = this.board.history().length % 2;
        // Validate whose move
        if ((curSize === 0 && this.player1 !== socket) ||
            (curSize !== 0 && this.player2 !== socket)) {
            console.log("Invalid move by other player");
            return;
        }
        // DO the move
        try {
            this.board.move(move);
        }
        catch (e) {
            console.log("Error", e);
            return;
        }
        if (this.board.isGameOver()) {
            let winner = "";
            let winType = "";
            if (this.board.isStalemate()) {
                winner = "draw";
                winType = "stalemate";
            }
            else if (this.board.isInsufficientMaterial()) {
                winner = "draw";
                winType = "insufficient_material";
            }
            else if (this.board.isThreefoldRepetition()) {
                winner = "draw";
                winType = "threefold_repitition";
            }
            else if (this.board.isDrawByFiftyMoves()) {
                winner = "draw";
                winType = "fifty_moves";
            }
            else if (this.board.isDraw()) {
                winner = "draw";
                winType = "draw";
            }
            else if (this.board.isCheckmate()) {
                winner = this.board.turn() === "w" ? "black" : "white";
                winType = "checkmate";
            }
            else if (this.board.isCheck()) {
                console.log("Check", this.board.ascii());
            }
            const gameOverMessage = JSON.stringify({
                type: messages_1.GAME_OVER,
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
            type: messages_1.UPDATE_BOARD,
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
}
exports.Game = Game;
