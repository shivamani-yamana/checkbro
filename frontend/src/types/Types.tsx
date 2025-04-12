import { Chess } from "chess.js";

export interface ChessMovesHistoryType {
  color: string;
  from: string;
  to: string;
  flags: string;
  piece: string;
  san?: string;
}

export interface GameContextType {
  socket: WebSocket | null;
  chess: Chess;
  gameState: "waiting" | "playing" | "over";
  playerColor: "white" | "black" | null;
  currentTurn: "white" | "black";
  moveHistory: ChessMovesHistoryType[];
  winner: string | null;
  startGame: () => void;
  makeMove: (move: { from: string; to: string }) => void;
  resign: () => void;
  offerDraw: () => void;
  // Add any other properties that are in your value object
}
