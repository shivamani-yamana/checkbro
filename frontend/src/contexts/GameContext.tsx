import { Chess } from "chess.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useSocket } from "../hooks/useSocket";
import { GameContextType, ChessMovesHistoryType } from "@/types/Types";
import {
  DRAW_ACCEPTED,
  DRAW_DECLINED,
  DRAW_OFFER,
  GAME_OVER,
  INIT_GAME,
  MOVE,
  OFFER_DRAW,
  OPPONENT_DISCONNECTED,
  PING,
  PONG,
  RESIGN,
  UPDATE_BOARD,
} from "@/lib/messages";
import { usePlayerContext } from "./PlayerContext";

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
  const [gameState, setGameState] = useState<
    | "waiting"
    | "playing"
    | "over_checkmate"
    | "over_stalemate"
    | "over_resign"
    | "over_draw"
    | "over_opponent_disconnect"
  >("waiting");
  const [moveHistory, setMoveHistory] = useState<ChessMovesHistoryType[]>([]);
  const [currentTurn, setCurrentTurn] = useState<"white" | "black">("white");
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(
    null
  );
  const [winner, setWinner] = useState<"white" | "black" | null>(null);
  const [drawOfferedBy, setDrawOfferedBy] = useState<"white" | "black" | null>(
    null
  );
  const [opponentName, setOpponentName] = useState<string | null>(null);

  const { playerName } = usePlayerContext();

  const startGame = useCallback(() => {
    // console.log("Start game function called at GameContext");
    setGameState("waiting");
    setChess(new Chess()); // Reset the chess game state
    setMoveHistory([]); // Reset the move history
    setCurrentTurn("white"); // Reset the current turn to white
    setWinner(null); // Reset the winner
    setDrawOfferedBy(null); // Reset the draw offered by state
    setPlayerColor(null); // Reset the player color
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("Sending INIT_GAME message to server");
      socket.send(
        JSON.stringify({
          type: INIT_GAME,
          payload: {
            playerName: playerName,
          },
        })
      );
    } else {
      console.error(
        "Socket not ready or not connected when trying to start game"
      );
    }
  }, [socket]);

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
          type: RESIGN,
          payload: {},
        })
      );
    }
  }, [socket, gameState, playerColor]);

  const offerDraw = useCallback(() => {
    if (socket && gameState === "playing") {
      socket.send(
        JSON.stringify({
          type: OFFER_DRAW,
          payload: {},
        })
      );
    }
  }, [socket, gameState]);

  const acceptDraw = useCallback(() => {
    if (socket && gameState === "playing") {
      socket.send(
        JSON.stringify({
          type: DRAW_ACCEPTED,
          payload: {},
        })
      );
    }
  }, [socket, gameState]);

  const declineDraw = useCallback(() => {
    if (socket && gameState === "playing") {
      socket.send(
        JSON.stringify({
          type: DRAW_DECLINED,
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
          case PING:
            socket.send(
              JSON.stringify({
                type: PONG,
              })
            );
            break;

          case INIT_GAME:
            setGameState("playing");
            setPlayerColor(message.payload.color); // Set player color based on server response
            setOpponentName(message.opponentName || null);
            setChess(new Chess()); // Initialize the chess game state
            console.log("Set opponent name:", message.opponentName);
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
            const winType = message.payload.winType;
            if (winType === "checkmate") {
              setGameState("over_checkmate");
              setWinner(message.payload.winner); // Set the winner based on server response
            } else if (winType === "stalemate") {
              setGameState("over_stalemate");
              setWinner(null); // Set the winner as draw
            } else if (winType === "resign") {
              setGameState("over_resign");
              setWinner(message.payload.winner); // Set the winner based on server response
            } else if (winType === "draw") {
              setGameState("over_draw");
              setWinner(null); // Set the winner as draw
            } else if (winType === "insufficient_material") {
              setGameState("over_draw");
              setWinner(null); // Set the winner as draw
            } else if (winType === "threefold_repetition") {
              setGameState("over_draw");
              setWinner(null); // Set the winner as draw
            } else if (winType === "fifty_moves") {
              setGameState("over_draw");
              setWinner(null); // Set the winner as draw
            }
            // Set the winner based on server response
            break;

          case RESIGN:
            console.log("Opponent resigned", message.payload.winner);
            setGameState("over_resign");
            setWinner(message.payload.winner); // Set the winner based on server response
            break;

          case DRAW_OFFER:
            setDrawOfferedBy(message.payload.player); // Set the color of the player who offered the draw
            console.log("Draw offered by", message.payload.player);
            break;
          case DRAW_ACCEPTED:
            console.log("Draw accepted");
            setGameState("over_draw");
            setWinner(null); // Set the winner as draw
            break;
          case DRAW_DECLINED:
            console.log("Draw declined");
            setDrawOfferedBy(null); // Reset the draw offered by state
            break;
          case OPPONENT_DISCONNECTED:
            console.log("Opponent disconnected", message.payload);
            setGameState("over_opponent_disconnect"); // Set the game state to over_draw
            setWinner(message.payload.winner); // Set the winner as draw
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
    opponentName,
    currentTurn,
    winner,
    moveHistory,
    startGame,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    drawOfferedBy,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
