import { Chessboard } from "react-chessboard";
import { useGameContext } from "../contexts/GameContext";
import { useEffect, useState } from "react";
import Button from "./Button";
import Spinner from "./ui/Spinner";
import { usePlayerContext } from "@/contexts/PlayerContext";

interface ChessboardViewProps {
  showProfileControls?: boolean;
}

function ChessboardView({ showProfileControls = true }: ChessboardViewProps) {
  const {
    gameState,
    chess,
    playerColor,
    winner,
    makeMove,
    startGame,
    acceptDraw,
    declineDraw,
    drawOfferedBy,
  } = useGameContext();

  const { playerName, declarePlayerName } = usePlayerContext();

  // Move all useState hooks to the top level of the component
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [chessboard, setChessboard] = useState(chess.fen());
  const [currentTurn, setCurrentTurn] = useState(
    chess.turn() === "w" ? "white" : "black"
  );

  // Add these state variables for the dialogs
  const [nameInputValue, setNameInputValue] = useState("");
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [profileNameValue, setProfileNameValue] = useState(playerName || "");
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

  // Update position when chess changes
  useEffect(() => {
    setChessboard(chess.fen());
    console.log("Chessboard updated:", chess.fen());
    setCurrentTurn(chess.turn() === "w" ? "white" : "black");
  }, [chess.fen()]);

  // Update profile name value when playerName changes
  useEffect(() => {
    setProfileNameValue(playerName || "");
  }, [playerName]);

  useEffect(() => {
    if (gameState === "playing") {
      setIsWaiting(false);
    }
  }, [gameState]);

  // Validation function for names
  const validateName = (name: string) => {
    const nameRegex = /^[A-Za-z]{3,14}$/;
    return nameRegex.test(name);
  };

  const handlePlayNow = () => {
    if (!playerName) {
      setShowNamePrompt(true);
      return;
    }
    setIsWaiting(true);
    startGame();
  };

  const handlePlayAgain = () => {
    if (gameState.startsWith("over")) {
      if (!playerName) {
        setShowNamePrompt(true);
        return;
      }

      setIsWaiting(true);

      setTimeout(() => {
        startGame();
      }, 300);
    }
  };

  const renderDrawOfferDialog = () => {
    if (!drawOfferedBy || gameState !== "playing") return null;

    // Only show dialog to the player who received the offer
    if (playerColor === drawOfferedBy) return null;

    return (
      <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-10">
        <div className="bg-gray-800 p-6 rounded-lg text-center shadow-xl">
          <h3 className="text-xl font-bold mb-4">Draw Offer</h3>
          <p className="mb-4">Your opponent is offering a draw</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={acceptDraw} color="green">
              Accept
            </Button>
            <Button onClick={declineDraw} color="red">
              Decline
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderNamePromptDialog = () => {
    const handleNameSubmit = () => {
      // Validate name
      if (!validateName(nameInputValue)) {
        setNameInputError(
          "Name must be 3-14 characters and contain only alphabets"
        );
        return;
      }

      declarePlayerName(nameInputValue);
      setIsWaiting(true);
      startGame();
      setShowNamePrompt(false);
    };

    return (
      <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
        <div className="bg-gray-800 p-6 rounded-lg text-center shadow-xl w-80">
          <div className="mb-2">
            <h3 className="text-xl font-bold mb-4">Enter Your Name</h3>
            <p className="mb-4 text-gray-300">
              Please enter your name to continue
            </p>
          </div>

          <div className="mb-6">
            <input
              type="text"
              value={nameInputValue}
              onChange={(e) => {
                setNameInputValue(e.target.value);
                setNameInputError(null);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
            {nameInputError && (
              <p className="text-red-400 text-sm text-left">{nameInputError}</p>
            )}
          </div>

          <Button
            onClick={handleNameSubmit}
            color="green"
            className="w-full"
            disabled={nameInputValue.length < 3}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  };

  const renderProfileDialog = () => {
    const handleNameSubmit = () => {
      // Validate name
      if (!validateName(profileNameValue)) {
        setProfileNameError(
          "Name must be 3-14 characters and contain only alphabets"
        );
        return;
      }

      declarePlayerName(profileNameValue);
      setShowProfileDialog(false);
    };

    return (
      <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20">
        <div className="bg-gray-800 p-6 rounded-lg text-center shadow-xl w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Your Profile</h3>
            <button
              onClick={() => setShowProfileDialog(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-left text-sm font-medium text-gray-400 mb-1">
              Player Name
            </label>
            <input
              type="text"
              value={profileNameValue}
              onChange={(e) => {
                setProfileNameValue(e.target.value);
                setProfileNameError(null);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
            {profileNameError && (
              <p className="text-red-400 text-sm text-left">
                {profileNameError}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowProfileDialog(false)}
              color="gray"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNameSubmit}
              color="green"
              className="flex-1"
              disabled={profileNameValue.length < 3}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Add Settings button to the game interface
  const renderSettingsButton = () => {
    if (!showProfileControls) return null;

    return (
      <button
        onClick={() => setShowProfileDialog(true)}
        className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 shadow-md z-10"
        title="Profile Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>
    );
  };

  // Show profile information in waiting and playing states
  const renderPlayerInfo = () => {
    if (!showProfileControls || !playerName) return null;

    return (
      <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-3 py-1 rounded shadow-md z-10">
        <div className="flex items-center">
          <span className="font-medium">Playing as: {playerName}</span>
        </div>
      </div>
    );
  };

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

  // Modify the Play Now section
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

        {/* Show profile dialog if active */}
        {showNamePrompt && renderNamePromptDialog()}

        {/* Show profile dialog if active */}
        {showProfileDialog && renderProfileDialog()}

        {/* Add settings button if player has a name */}
        {playerName && renderSettingsButton()}
        {renderPlayerInfo()}

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

  // Inside the Game over conditional block
  if (gameState.startsWith("over")) {
    return (
      <div className="relative w-full h-full">
        <Chessboard
          position={chessboard}
          boardOrientation={playerColor === "white" ? "white" : "black"}
          arePiecesDraggable={false}
        />

        {/* Show profile dialog if active */}
        {showNamePrompt && renderNamePromptDialog()}
        {showProfileDialog && renderProfileDialog()}

        {/* Add settings button */}
        {renderSettingsButton()}
        {renderPlayerInfo()}

        {/* Game over overlay */}
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-lg text-center shadow-xl flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold mb-3">
              Game Over:{" "}
              {gameState === "over_checkmate"
                ? "Checkmate"
                : gameState === "over_stalemate"
                ? "Stalemate"
                : gameState === "over_resign"
                ? "Resignation"
                : gameState === "over_draw"
                ? "Draw"
                : gameState === "over_opponent_disconnect"
                ? "Opponent Disconnected"
                : ""}
            </h2>

            {/* Updated result message */}
            {winner ? (
              <p className="mb-4 text-xl">
                {winner === playerColor
                  ? gameState === "over_opponent_disconnect"
                    ? "You Won by Forfeit!"
                    : "You Won!"
                  : `Opponent (${winner}) Won`}
              </p>
            ) : (
              <p className="mb-4 text-xl">Draw Game</p>
            )}

            <Button onClick={handlePlayAgain} color="blue">
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

        {/* Show profile dialog if active */}
        {showProfileDialog && renderProfileDialog()}

        {/* Add settings button */}
        {renderSettingsButton()}
        {renderPlayerInfo()}

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

  // Playing state
  return (
    <div className="w-full h-full relative">
      <Chessboard
        position={chessboard}
        onPieceDrop={onDrop}
        boardOrientation={playerColor === "white" ? "white" : "black"}
      />
      {/* Show profile dialog if active */}
      {showProfileDialog && renderProfileDialog()}

      {/* Add settings button */}
      {renderSettingsButton()}
      {renderPlayerInfo()}

      {renderDrawOfferDialog()}
    </div>
  );
}

export default ChessboardView;
