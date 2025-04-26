import { Chess } from "chess.js";

export type CapturedPiece = {
  type: string;
  count: number;
};

export interface ChessMovesHistoryType {
  color: string;
  from: string;
  to: string;
  flags: string;
  piece: string;
  san?: string;
  captured?: string; // Add the captured property
  promotion?: string;
}

export interface GameContextType {
  socket: WebSocket | null;
  chess: Chess;
  gameState:
    | "waiting"
    | "playing"
    | "over_checkmate"
    | "over_stalemate"
    | "over_resign"
    | "over_draw"
    | "over_opponent_disconnect";
  playerColor: "white" | "black" | null;
  opponentName: string | null;
  currentTurn: "white" | "black";
  moveHistory: ChessMovesHistoryType[];
  winner: string | null;
  moveError: string | null;
  isConnecting: boolean;
  isReconnecting: boolean;
  opponentDisconnectTime: Number | null;
  opponentTimeRemaining: number;
  isOnline: boolean;
  isOpponentDisconnected: boolean;
  reconnectionWindowSeconds: number;
  boardKey: number; // Add the boardKey property
  setOpponentTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  setGameState: React.Dispatch<
    React.SetStateAction<
      | "waiting"
      | "playing"
      | "over_checkmate"
      | "over_stalemate"
      | "over_resign"
      | "over_draw"
      | "over_opponent_disconnect"
    >
  >;
  setIsOpponentDisconnected: React.Dispatch<React.SetStateAction<boolean>>;
  // setOpponentDisconnectTime: React.Dispatch<
  // React.SetStateAction<Number | null>
  // >;
  reconnect: () => void;
  setMoveError: (error: string | null) => void;
  startGame: () => void;
  makeMove: (move: { from: string; to: string; promotion?: string }) => void;
  resign: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  drawOfferedBy: "white" | "black" | null;
  capturedPieces: {
    byPlayer: CapturedPiece[];
    byOpponent: CapturedPiece[];
  };
  lastMove: { from: string; to: string } | null;
  // Add any other properties that are in your value object
}

export interface PlayerContextType {
  playerName: string | null;
  declarePlayerName: (name: string) => void;
  clearPlayerName: () => void;
  setShowProfileDialog: (value: boolean) => void;
}
