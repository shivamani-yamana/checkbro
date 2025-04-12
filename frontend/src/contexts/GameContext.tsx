import { Chess } from "chess.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  GAME_OVER,
  INIT_GAME,
  MOVE,
  UPDATE_BOARD,
} from "../components/ChessboardView";
import { useSocket } from "../hooks/useSocket";
import { GameContextType, ChessMovesHistoryType } from "@/types/Types";

const GameContext = createContext<GameContextType | null>(null);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === null) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const socket = useSocket();
  const [chess, setChess] = useState<Chess>(new Chess());
  const [gameState, setGameState] = useState<"waiting" | "playing" | "over">(
    "waiting"
  );
  const [moveHistory, setMoveHistory] = useState<ChessMovesHistoryType[]>([]);
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(
    null
  );
  const [winner, setWinner] = useState<"white" | "black" | null>(null);

  const startGame = useCallback(() => {
    console.log("Start game function called at GameContext");
    if (socket && gameState === "waiting") {
      console.log("Sending init game message to server");
      socket.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {},
        })
      );
    }
  }, [socket, gameState]);

  const makeMove = useCallback(
    (move: { from: string; to: string }) => {
      if (socket && gameState === "playing") {
        console.log("Sending move to server", move);
        socket.send(
          JSON.stringify({
            type: MOVE,
            move: move,
          })
        );
        // setCurrentTurn(chess.turn() === "w" ? "white" : "black");
      }
    },
    [socket, gameState, chess]
  );

  const resign = useCallback(() => {
    if (socket && gameState === "playing") {
      socket.send(
        JSON.stringify({
          type: "resign",
          payload: {},
        })
      );
      setGameState("over");
      setWinner(playerColor === "white" ? "black" : "white"); // Set the opponent as the winner
    }
  }, [socket, gameState, playerColor]);

  const offerDraw = useCallback(() => {
    if (socket && gameState === "playing") {
      socket.send(
        JSON.stringify({
          type: "offer_draw",
          payload: {},
        })
      );
    }
  }, [socket, gameState]);

  useEffect(() => {
    if (!socket) {
      console.log("Socket is not initialized yet");
      return; // Socket is not initialized yet
    }

    const handleMessaage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Message received from server:", message);
        switch (message.type) {
          case INIT_GAME:
            setGameState("playing");
            setPlayerColor(message.payload.color); // Set player color based on server response
            setChess(new Chess()); // Initialize the chess game state
            console.log("Game initialized", message.payload);
            break;
          case UPDATE_BOARD:
            const board = message.payload.board;
            const completeHistory = message.payload.history;

            const updatedChess = new Chess(board);

            setMoveHistory(completeHistory); // Update the move history
            setChess(updatedChess); // Update the chess state

            const newTurn = updatedChess.turn() === "w" ? "white" : "black";
            setCurrentTurn(newTurn); // Update the current turn
            console.log("Current turn updated", newTurn);
            break;

          case GAME_OVER:
            console.log("Game over", message.payload.winner);
            setGameState("over");
            setWinner(message.payload.winner);
            // Set the winner based on server response
            break;

          default:
            console.log("Unknown message type", message.type);
        }
      } catch (e) {
        console.log("Error parsing message", e);
      }
    };

    socket.addEventListener("message", handleMessaage);
    return () => {
      socket.removeEventListener("message", handleMessaage);
    };
  }, [socket]);

  const value: GameContextType = {
    socket,
    chess,
    gameState,
    playerColor,
    currentTurn,
    winner,
    moveHistory,
    startGame,
    makeMove,
    resign,
    offerDraw,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
