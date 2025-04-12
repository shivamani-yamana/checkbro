import { Chessboard } from "react-chessboard";
import { useGameContext } from "../contexts/GameContext";
import { useEffect, useState } from "react";
import Button from "./Button";
import Spinner from "./ui/Spinner";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const UPDATE_BOARD = "update_board";

function ChessboardView() {
  const { gameState, chess, playerColor, winner, makeMove, startGame } =
    useGameContext();
  const [isWaiting, setIsWaiting] = useState(false);

  const [chessboard, setChessboard] = useState(chess.fen());
  const [currentTurn, setCurrentTurn] = useState(
    chess.turn() === "w" ? "white" : "black"
  );

  // Update position when chess changes
  useEffect(() => {
    setChessboard(chess.fen());
    console.log("Chessboard updated:", chess.fen());
    setCurrentTurn(chess.turn() === "w" ? "white" : "black");
  }, [chess.fen()]);

  const handlePlayNow = () => {
    setIsWaiting(true);
    startGame();
  };

  useEffect(() => {
    if (gameState === "playing") {
      setIsWaiting(false);
    }
  }, [gameState]);

  // Waiting for other player
  if (gameState === "waiting" && !isWaiting) {
    return (
      <div className="relative w-full h-full">
        {/* Show board in background with opacity */}
        <Chessboard
          position={chessboard}
          boardOrientation={playerColor === "white" ? "white" : "black"}
          arePiecesDraggable={false}
          customBoardStyle={{ opacity: 0.3 }}
        />

        {/* Play Now overlay */}
        <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center">
          <div className="text-center p-6 flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold mb-6">Chess Game</h2>
            <p className="text-gray-300 mb-8">
              Challenge another player to a game of chess
            </p>
            <Button
              onClick={handlePlayNow}
              color="green"
              className="px-8 py-3 text-lg"
            >
              Play Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game over
  if (gameState === "over") {
    return (
      <div className="relative w-full h-full">
        <Chessboard
          position={chessboard}
          boardOrientation={playerColor === "white" ? "white" : "black"}
          arePiecesDraggable={false}
        />

        {/* Game over overlay */}
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg text-center shadow-xl flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-3">Game Over</h2>
            <p className="mb-4">
              {winner ? `Winner: ${winner}` : "Game ended in a draw"}
            </p>
            <Button onClick={() => window.location.reload()} color="blue">
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // Waiting for opponent state
  if (gameState === "waiting" && isWaiting) {
    return (
      <div className="relative w-full h-full">
        {/* Show board in background with opacity */}
        <Chessboard
          position={chessboard}
          boardOrientation={playerColor === "white" ? "white" : "black"}
          arePiecesDraggable={false}
          customBoardStyle={{ opacity: 0.3 }}
        />

        {/* Waiting for opponent overlay */}
        <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4">
              <Spinner color="#3b82f6" />
            </div>
            <h2 className="text-xl font-bold mb-2">Waiting for Opponent</h2>
            <p className="text-gray-300">
              The game will start automatically when an opponent joins
            </p>
          </div>
        </div>
      </div>
    );
  }

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    // Only allow moves if it's the player's turn and game is in progress
    if (currentTurn !== playerColor || gameState !== "playing") {
      return false;
    }

    // Check if this is a pawn promotion move
    const moveOptions = {
      from: sourceSquare,
      to: targetSquare,
      // promotion: "q", // Default to queen promotion
    };

    // Handle the move through context
    makeMove(moveOptions);
    return true;
  };

  // Playing state
  return (
    <div className="w-full h-full">
      <Chessboard
        position={chessboard}
        onPieceDrop={onDrop}
        boardOrientation={playerColor === "white" ? "white" : "black"}
      />
    </div>
  );
}

export default ChessboardView;
