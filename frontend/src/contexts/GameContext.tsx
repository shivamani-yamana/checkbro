import { Chess } from "chess.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

import { useSocket, WebSocketMessage } from "../hooks/useSocket";
import {
  GameContextType,
  ChessMovesHistoryType,
  CapturedPiece,
} from "@/types/Types";
import {
  DRAW_ACCEPTED,
  DRAW_DECLINED,
  DRAW_OFFER,
  GAME_OVER,
  INIT_GAME,
  MOVE,
  OFFER_DRAW,
  OPPONENT_DISCONNECTED_TEMP,
  OPPONENT_RECONNECTED,
  RECONNECTION_FAILED,
  RECONNECTION_SUCCESSFUL,
  RESIGN,
  UPDATE_BOARD,
} from "@/lib/messages";
import { usePlayerContext } from "./PlayerContext";

// Import or recreate the frontend logger
enum LogLevel {
  ERROR = 0,
  INFO = 1,
  DEBUG = 2,
}

class FrontendLogger {
  private static level: LogLevel = LogLevel.INFO; // Default to INFO level

  static setLogLevel(level: LogLevel) {
    this.level = level;
  }

  static error(message: string, ...data: any[]) {
    console.error(`[ERROR] ${message}`, ...data);
  }

  static info(message: string, ...data: any[]) {
    if (this.level >= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...data);
    }
  }

  static debug(message: string, ...data: any[]) {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...data);
    }
  }
}

// Set log level based on environment
if (import.meta.env.MODE === "development") {
  FrontendLogger.setLogLevel(LogLevel.DEBUG);
} else {
  FrontendLogger.setLogLevel(LogLevel.INFO);
}

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
  const [gameState, setGameState] = useState<
    | "waiting"
    | "playing"
    | "over_checkmate"
    | "over_stalemate"
    | "over_resign"
    | "over_draw"
    | "over_opponent_disconnect"
  >("waiting");
  const handleSetGameState = useCallback((state: string) => {
    setGameState(
      state as
        | "waiting"
        | "playing"
        | "over_checkmate"
        | "over_stalemate"
        | "over_resign"
        | "over_draw"
        | "over_opponent_disconnect"
    );
  }, []);

  // Add reconnecting state to track automatic reconnection
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectionWindowSeconds, setReconnectionWindowSeconds] =
    useState<number>(60);

  const reconnectionCompleted = useRef(false);
  const boardUpdateRequired = useRef(false);

  // Add a state to track the last move
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null
  );

  // Handle game-specific messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    // console.log("Game context received message:", message.type);
    FrontendLogger.debug("Game context received message:", message.type);

    switch (message.type) {
      case INIT_GAME:
        setGameState("playing");
        setPlayerColor(message.payload.color); // Set player color based on server response
        setOpponentName(message.payload?.opponentName || null);
        setChess(new Chess()); // Initialize the chess game state
        setLastMove(null); // Reset last move on new game
        // console.log("Set opponent name:", message.payload?.opponentName);
        // console.log("Game initialized", message.payload);
        FrontendLogger.info(
          "Set opponent name:",
          message.payload?.opponentName
        );
        FrontendLogger.debug("Game initialized", message.payload);
        break;

      case UPDATE_BOARD:
        const board = message.payload.board;
        const completeHistory = message.payload.history;

        const updatedChess = new Chess(board);

        // Handle last move tracking
        if (completeHistory && completeHistory.length > 0) {
          const lastMoveData = completeHistory[completeHistory.length - 1];
          setLastMove({
            from: lastMoveData.from,
            to: lastMoveData.to,
          });
          // console.log(
          //   `Last move tracked: ${lastMoveData.from} → ${lastMoveData.to}`
          // );
          FrontendLogger.debug(
            `Last move tracked: ${lastMoveData.from} → ${lastMoveData.to}`
          );
        }

        setMoveHistory(completeHistory); // Update the move history
        setChess(updatedChess); // Update the chess state

        const newTurn = updatedChess.turn() === "w" ? "white" : "black";
        setCurrentTurn(newTurn); // Update the current turn
        // console.log("Current turn updated", newTurn);
        FrontendLogger.debug("Current turn updated", newTurn);
        break;

      case GAME_OVER:
        // console.log("Game over", message.payload.winner);
        FrontendLogger.info("Game over", message.payload.winner);
        const winType = message.payload.winType;
        if (winType === "checkmate") {
          setGameState("over_checkmate");
          setWinner(message.payload.winner); // Set the winner based on server response
        } else if (winType === "stalemate") {
          setGameState("over_stalemate");
          setWinner(null); // No winner in a stalemate
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
        } else if (winType === "disconnection") {
          // Handle disconnection win type
          setGameState("over_opponent_disconnect");
          setWinner(message.payload.winner); // Set the winner based on server response
        }
        break;

      case RESIGN:
        // console.log("Opponent resigned", message.payload.winner);
        FrontendLogger.info("Opponent resigned", message.payload.winner);
        setGameState("over_resign");
        setWinner(message.payload.winner); // Set the winner based on server response
        break;

      case DRAW_OFFER:
        setDrawOfferedBy(message.payload.player); // Set the color of the player who offered the draw
        // console.log("Draw offered by", message.payload.player);
        FrontendLogger.info("Draw offered by", message.payload.player);
        break;

      case DRAW_ACCEPTED:
        // console.log("Draw accepted");
        FrontendLogger.info("Draw accepted");
        setGameState("over_draw");
        setWinner(null); // Set the winner as draw
        break;

      case DRAW_DECLINED:
        // console.log("Draw declined");
        FrontendLogger.info("Draw declined");
        setDrawOfferedBy(null); // Reset the draw offered by state
        break;

      case OPPONENT_DISCONNECTED_TEMP:
        setIsOpponentDisconnected(true);
        const seconds = message.payload.reconnectionWindowSeconds || 120; // Default to 2 minutes
        setReconnectionWindowSeconds(seconds);
        setOpponentDisconnectTime(Date.now());
        setOpponentTimeRemaining(seconds);
        break;

      case OPPONENT_RECONNECTED:
        setIsOpponentDisconnected(false);
        setOpponentDisconnectTime(null);
        setOpponentTimeRemaining(0);
        break;

      case RECONNECTION_SUCCESSFUL:
        // console.log("RECONNECTION_SUCCESSFUL message received");
        FrontendLogger.info("RECONNECTION_SUCCESSFUL message received");

        // Set the reconnection as completed
        reconnectionCompleted.current = true;
        boardUpdateRequired.current = true;

        const {
          gameState,
          color,
          opponentName: opponentNameFromServer,
        } = message.payload;
        // console.log("Received game state on reconnection:", gameState);
        FrontendLogger.debug("Received game state on reconnection:", gameState);

        // Set these first for UI updates
        setPlayerColor(color);
        setOpponentName(opponentNameFromServer);

        // Create a new chess instance with the FEN from server
        try {
          if (gameState && gameState.fen) {
            // console.log("Loading FEN from server:", gameState.fen);
            FrontendLogger.debug("Loading FEN from server:", gameState.fen);
            const newChess = new Chess();

            // Load the FEN position
            newChess.load(gameState.fen);

            // Force a board key change to ensure re-render
            setBoardKey((prev) => prev + 1);

            // Update the chess instance
            setChess(newChess);

            // Update move history if available
            if (gameState.moveHistory && Array.isArray(gameState.moveHistory)) {
              // console.log("Setting move history:", gameState.moveHistory);
              FrontendLogger.debug(
                "Setting move history:",
                gameState.moveHistory
              );
              setMoveHistory(gameState.moveHistory);
            } else {
              // console.warn("No move history received from server");
              FrontendLogger.error("No move history received from server");
              setMoveHistory([]);
            }

            // Update turn
            const newTurn = newChess.turn() === "w" ? "white" : "black";
            setCurrentTurn(newTurn);
            // console.log("Current turn set to:", newTurn);
            FrontendLogger.debug("Current turn set to:", newTurn);

            // Force a delay before setting game state to ensure other state is updated first
            setTimeout(() => {
              // Set game state
              setGameState("playing");
              // console.log("Game state set to playing after reconnection");
              FrontendLogger.info(
                "Game state set to playing after reconnection"
              );

              // Force another board update after a delay
              setTimeout(() => {
                setBoardKey((prev) => prev + 1);
                // console.log("Forced second board re-render");
                FrontendLogger.debug("Forced second board re-render");

                // Turn off reconnecting UI after ensuring board is updated
                setTimeout(() => {
                  // console.log(
                  //   "Setting reconnecting to false after successful reconnection"
                  // );
                  FrontendLogger.debug(
                    "Setting reconnecting to false after successful reconnection"
                  );
                  setReconnecting(false);
                }, 100);
              }, 200);

              // console.log(
              //   "Successfully reconnected to game and restored board state"
              // );
              FrontendLogger.info(
                "Successfully reconnected to game and restored board state"
              );
            }, 100);
          } else {
            // console.error("Invalid game state received:", gameState);
            FrontendLogger.error("Invalid game state received:", gameState);
            setReconnecting(false);
          }
        } catch (err) {
          // console.error("Error restoring chess state:", err);
          FrontendLogger.error("Error restoring chess state:", err);
          setReconnecting(false);
        }
        break;

      case RECONNECTION_FAILED:
        // console.log("RECONNECTION_FAILED message received");
        FrontendLogger.info("RECONNECTION_FAILED message received");
        reconnectionCompleted.current = false;
        setReconnecting(false);
        setGameState("waiting");
        break;
    }
  }, []);

  // Initialize the socket with our message handler
  const {
    socket,
    isConnecting,
    reconnect,
    sendMessage, // Use the new helper method
  } = useSocket({
    setGameState: handleSetGameState,
    setReconnecting,
    onMessage: handleMessage, // Pass our message handler
  });

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [opponentDisconnectTime, setOpponentDisconnectTime] =
    useState<Number | null>(null);
  const [opponentTimeRemaining, setOpponentTimeRemaining] = useState(0);

  // Create a timer effect for opponent disconnect timeout
  useEffect(() => {
    if (isOpponentDisconnected && opponentTimeRemaining > 0) {
      const timer = setInterval(() => {
        setOpponentTimeRemaining((prev) => {
          // If time reaches 0, set game over with disconnection
          if (prev <= 1) {
            setGameState("over_opponent_disconnect");
            setWinner(playerColor); // Set the current player as winner
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpponentDisconnected, opponentTimeRemaining]);

  const [chess, setChess] = useState<Chess>(new Chess());
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
  const [moveError, setMoveError] = useState<string | null>(null);

  // Add a key to force component re-rendering
  const [boardKey, setBoardKey] = useState(0);

  const [capturedPieces, setCapturedPieces] = useState<{
    byPlayer: CapturedPiece[];
    byOpponent: CapturedPiece[];
  }>({
    byPlayer: [],
    byOpponent: [],
  });

  const { playerName } = usePlayerContext();

  // Check for online / offline of client
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (gameState === "playing" && chess && moveHistory.length > 0) {
      // Determine player colors
      const playerColorCode = playerColor === "white" ? "w" : "b";

      // Track captures by player and opponent
      const capturedByPlayer: Record<string, number> = {
        p: 0,
        n: 0,
        b: 0,
        r: 0,
        q: 0,
        k: 0,
      };
      const capturedByOpponent: Record<string, number> = {
        p: 0,
        n: 0,
        b: 0,
        r: 0,
        q: 0,
        k: 0,
      };

      // Process each move in history
      moveHistory.forEach((move) => {
        // If this move was a capture
        if (move.flags.includes("c") && (move as any).captured) {
          // Check if the capturing player was the player or opponent
          if (move.color === playerColorCode) {
            capturedByPlayer[(move as any).captured]++;
          } else {
            capturedByOpponent[(move as any).captured]++;
          }
        }
      });

      // Convert to array format
      const playerCaptures: CapturedPiece[] = [];
      const opponentCaptures: CapturedPiece[] = [];

      Object.entries(capturedByPlayer).forEach(([type, count]) => {
        if (type !== "k" && count > 0) {
          playerCaptures.push({ type, count });
        }
      });

      Object.entries(capturedByOpponent).forEach(([type, count]) => {
        if (type !== "k" && count > 0) {
          opponentCaptures.push({ type, count });
        }
      });

      setCapturedPieces({
        byPlayer: playerCaptures,
        byOpponent: opponentCaptures,
      });
    } else if (gameState === "waiting") {
      // Reset captured pieces when game resets
      setCapturedPieces({
        byPlayer: [],
        byOpponent: [],
      });
    }
  }, [moveHistory, playerColor, gameState]);

  const startGame = useCallback(() => {
    // console.log("Start game function called at GameContext");
    FrontendLogger.debug("Start game function called at GameContext");
    setGameState("waiting");
    setChess(new Chess()); // Reset the chess game state
    setMoveHistory([]); // Reset the move history
    setCurrentTurn("white"); // Reset the current turn to white
    setWinner(null); // Reset the winner
    setDrawOfferedBy(null); // Reset the draw offered by state
    setPlayerColor(null); // Reset the player color

    // Use the new sendMessage helper
    sendMessage(INIT_GAME, {
      playerName: playerName,
    });
  }, [sendMessage, playerName]);

  const makeMove = useCallback(
    (move: { from: string; to: string; promotion?: string }) => {
      if (gameState === "playing") {
        // console.log("Sending move to server", move);
        FrontendLogger.debug("Sending move to server", move);

        // OPTIMISTIC UPDATE: Apply move locally first for instant feedback
        try {
          const newChess = new Chess(chess.fen());
          const result = newChess.move(move);

          if (result) {
            // Update local state immediately
            setChess(newChess);
            setCurrentTurn(newChess.turn() === "w" ? "white" : "black");
          }
        } catch (error) {
          // console.error("Invalid move", error);
          FrontendLogger.error("Invalid move", error);
        }

        // Then send to server using the new sendMessage helper
        sendMessage(MOVE, move);
      }
    },
    [gameState, chess, sendMessage]
  );

  const resign = useCallback(() => {
    if (gameState === "playing") {
      sendMessage(RESIGN, {});
    }
  }, [gameState, sendMessage]);

  const offerDraw = useCallback(() => {
    if (gameState === "playing") {
      sendMessage(OFFER_DRAW, {});
    }
  }, [gameState, sendMessage]);

  const acceptDraw = useCallback(() => {
    if (gameState === "playing") {
      sendMessage(DRAW_ACCEPTED, {});
    }
  }, [gameState, sendMessage]);

  const declineDraw = useCallback(() => {
    if (gameState === "playing") {
      sendMessage(DRAW_DECLINED, {});
    }
  }, [gameState, sendMessage]);

  // Add a special effect to force chess instance to be updated after reconnection
  useEffect(() => {
    if (boardUpdateRequired.current && reconnectionCompleted.current) {
      // console.log("Forcing chess board update after reconnection");
      FrontendLogger.debug("Forcing chess board update after reconnection");
      boardUpdateRequired.current = false;

      // We can force an update by creating a new reference to the chess object
      setChess((chess) => {
        const newChess = new Chess(chess.fen());
        return newChess;
      });
    }
  }, [reconnectionCompleted.current]);

  const value: GameContextType = {
    socket,
    chess,
    gameState,
    playerColor,
    opponentName,
    currentTurn,
    winner,
    moveHistory,
    moveError,
    isConnecting,
    isOnline,
    opponentDisconnectTime,
    opponentTimeRemaining,
    isOpponentDisconnected,
    reconnect: reconnect,
    isReconnecting: reconnecting,
    reconnectionWindowSeconds,
    setMoveError,
    startGame,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    drawOfferedBy,
    capturedPieces,
    setGameState,
    setIsOpponentDisconnected,
    setOpponentTimeRemaining,
    boardKey,
    lastMove, // Add lastMove to the context value
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
