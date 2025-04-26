import { Chessboard } from "react-chessboard";
import { useGameContext } from "../contexts/GameContext";
import { memo, useCallback, useEffect, useMemo, useState, useRef } from "react";
import Button from "./Button";
import Spinner from "./ui/Spinner";
import { usePlayerContext } from "@/contexts/PlayerContext";
import { Chess, Square } from "chess.js";
import React from "react";
import { BoardOrientation } from "react-chessboard/dist/chessboard/types";

interface ChessboardViewProps {
  showProfileControls?: boolean;
}
// Add CSS for smooth transitions
const chessBoardStyles = {
  transition: "all 0.3s ease-out",
  willChange: "transform, opacity",
  width: "100%",
  height: "100%",
};

interface NamePromptDialogProps {
  nameInputValue: string;
  nameInputError: string | null;
  onNameChange: (value: string) => void;
  onErrorChange: (error: string | null) => void;
  onSubmit: () => void;
}

// Memoize dialogs as separate components
const NamePromptDialog = memo(
  ({
    nameInputValue,
    nameInputError,
    onNameChange,
    onSubmit,
    onErrorChange,
  }: NamePromptDialogProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onNameChange(e.target.value);
      onErrorChange(null);
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
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 mb-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
            {nameInputError && (
              <p className="text-red-400 text-sm text-left">{nameInputError}</p>
            )}
          </div>

          <Button
            onClick={onSubmit}
            color="green"
            className="w-full"
            disabled={nameInputValue.length < 3}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }
);

// Memoize the Chessboard component for better performance
const MemoizedChessboard = memo(Chessboard);

const ChessboardView = React.memo(function ChessboardView({
  showProfileControls = true,
}: ChessboardViewProps) {
  const {
    gameState,
    chess,
    playerColor,
    winner,
    isOnline,
    makeMove,
    startGame,
    acceptDraw,
    declineDraw,
    drawOfferedBy,
    moveError,
    setMoveError,
    lastMove, // Get lastMove directly from context
  } = useGameContext();

  const { playerName, declarePlayerName } = usePlayerContext();

  // Use refs for values that shouldn't trigger re-renders
  const lastMoveTime = useRef(Date.now());
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renderCount = useRef(0);

  // Create custom square styles for highlighting
  const customSquareStyles = useMemo(() => {
    // Use a plain JavaScript object
    const styles: { [key: string]: React.CSSProperties } = {};

    try {
      // Check if a king is in check
      const isInCheck = chess.inCheck();

      if (isInCheck) {
        // Find the king's position
        const board = chess.board();
        const kingColor = chess.turn();

        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && piece.type === "k" && piece.color === kingColor) {
              const file = "abcdefgh"[j];
              const rank = 8 - i;
              const square = `${file}${rank}`;

              // Highlight king in check with red
              styles[square] = {
                backgroundColor: "rgba(255, 0, 0, 0.4)",
                boxShadow: "inset 0 0 0 2px red",
              };
            }
          }
        }
      }

      // Only apply last move highlighting if we have a valid move from context
      if (
        lastMove &&
        typeof lastMove.from === "string" &&
        typeof lastMove.to === "string"
      ) {
        const { from, to } = lastMove;

        // Apply a softer highlight color for better visual aesthetics
        styles[from] = {
          ...styles[from],
          backgroundColor: "rgba(194, 180, 80, 0.35)", // Softer gold/tan color
          boxShadow: "inset 0 0 0 2px rgba(194, 180, 80, 0.7)", // Matching border
        };

        styles[to] = {
          ...styles[to],
          backgroundColor: "rgba(194, 180, 80, 0.35)", // Softer gold/tan color
          boxShadow: "inset 0 0 0 2px rgba(194, 180, 80, 0.7)", // Matching border
        };

        console.log(`Highlighting move (from context): ${from} → ${to}`);
      }
    } catch (error) {
      console.error("Error generating square styles:", error);
    }

    return styles;
  }, [chess, lastMove]); // Depend directly on chess and lastMove from context

  // Performance monitoring
  useEffect(() => {
    renderCount.current++;
    console.log(`ChessboardView rendered ${renderCount.current} times`);
  });

  // Consolidated state object
  const [uiState, setUiState] = useState({
    showNamePrompt: false,
    showProfileDialog: false,
    isWaiting: false,
  });

  const { showNamePrompt, showProfileDialog, isWaiting } = uiState;

  // Dialog input states
  const [nameInputValue, setNameInputValue] = useState("");
  const [nameInputError, setNameInputError] = useState<string | null>(null);
  const [profileNameValue, setProfileNameValue] = useState(playerName || "");
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

  // Memoize derived values that depend on chess state
  const chessboardPosition = useMemo(() => {
    // Only update position when meaningful changes occur
    const fen = chess.fen();
    // Extract just the position part (before the space)
    return fen.split(" ")[0];
  }, [chess]);

  const currentTurn = useMemo(
    () => (chess.turn() === "w" ? "white" : "black"),
    [chess.turn()]
  );

  // UI state updater with batching
  const updateUI = useCallback((updates: Partial<typeof uiState>) => {
    // Use requestAnimationFrame for visual updates
    requestAnimationFrame(() => {
      setUiState((prev) => ({ ...prev, ...updates }));
    });
  }, []);

  // Display move errors with auto-clearing
  useEffect(() => {
    if (moveError) {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      moveTimeoutRef.current = setTimeout(() => {
        setMoveError(null);
        moveTimeoutRef.current = null;
      }, 2000);
    }

    return () => {
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
    };
  }, [moveError, setMoveError]);

  // Sync external state changes
  useEffect(() => {
    setProfileNameValue(playerName || "");
  }, [playerName]);

  useEffect(() => {
    if (gameState === "playing") {
      // Delay status change slightly to avoid flicker
      setTimeout(() => {
        updateUI({ isWaiting: false });
      }, 50);
    }
  }, [gameState, updateUI]);

  // Add passive touch event listeners to improve performance on mobile
  useEffect(() => {
    document.addEventListener("touchstart", () => {}, { passive: true });
    document.addEventListener("touchmove", () => {}, { passive: true });

    return () => {
      document.removeEventListener("touchstart", () => {});
      document.removeEventListener("touchmove", () => {});
    };
  }, []);

  // Name validation
  const validateName = useCallback((name: string) => {
    const nameRegex = /^[A-Za-z]{3,14}$/;
    return nameRegex.test(name);
  }, []);

  // Game action handlers with optimistic updates
  const handlePlayNow = useCallback(() => {
    if (!playerName) {
      updateUI({ showNamePrompt: true });
      return;
    }
    updateUI({ isWaiting: true });
    startGame();
  }, [playerName, updateUI, startGame]);

  const handlePlayAgain = useCallback(() => {
    if (gameState.startsWith("over")) {
      if (!playerName) {
        updateUI({ showNamePrompt: true });
        return;
      }

      updateUI({ isWaiting: true });

      // Add slight delay to ensure UI updates before making server request
      setTimeout(() => {
        startGame();
      }, 100);
    }
  }, [gameState, playerName, updateUI, startGame]);

  // Handle name submission from prompt
  const handleNamePromptSubmit = useCallback(() => {
    // Validate name
    if (!validateName(nameInputValue)) {
      setNameInputError(
        "Name must be 3-14 characters and contain only alphabets"
      );
      return;
    }

    declarePlayerName(nameInputValue);
    updateUI({ isWaiting: true, showNamePrompt: false });
    startGame();
  }, [nameInputValue, validateName, declarePlayerName, updateUI, startGame]);

  // Handle profile name update
  const handleProfileNameSubmit = useCallback(() => {
    // Validate name
    if (!validateName(profileNameValue)) {
      setProfileNameError(
        "Name must be 3-14 characters and contain only alphabets"
      );
      return;
    }

    declarePlayerName(profileNameValue);
    updateUI({ showProfileDialog: false });
  }, [profileNameValue, validateName, declarePlayerName, updateUI]);

  // Optimized helper function for promotion detection
  const isPromotionMove = useCallback(
    (from: string, to: string) => {
      const piece = chess.get(from as Square);
      if (!piece) return false;

      return (
        piece.type === "p" &&
        ((piece.color === "w" && to[1] === "8") ||
          (piece.color === "b" && to[1] === "1"))
      );
    },
    [chess]
  );

  // Optimized drop handler with throttling to prevent rapid moves
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      if (!isOnline) return false;
      // Throttle moves to prevent rapid clicking
      const now = Date.now();
      if (now - lastMoveTime.current < 200) {
        return false;
      }
      lastMoveTime.current = now;

      // Basic validation
      if (currentTurn !== playerColor || gameState !== "playing") {
        return false;
      }

      try {
        // Promotion detection
        if (isPromotionMove(sourceSquare, targetSquare)) {
          // Let the promotion dialog handle it
          return true;
        }

        // Local validation
        const chessClone = new Chess(chess.fen());
        const result = chessClone.move({
          from: sourceSquare as Square,
          to: targetSquare as Square,
        });

        if (!result) {
          setMoveError("Invalid move");
          return false;
        }

        // Apply move with requestAnimationFrame to ensure smooth UI
        requestAnimationFrame(() => {
          // Don't update lastMoveRef manually anymore as it's handled by context
          makeMove({
            from: sourceSquare,
            to: targetSquare,
          });
        });

        return true;
      } catch (error) {
        console.error("Error validating move:", error);
        setMoveError("Invalid move");
        return false;
      }
    },
    [
      currentTurn,
      playerColor,
      gameState,
      chess,
      isPromotionMove,
      makeMove,
      setMoveError,
    ]
  );

  // Promotion handler
  const handlePromotion = useCallback(
    (
      piece?: string | undefined,
      fromSquare?: Square | undefined,
      toSquare?: Square | undefined
    ) => {
      // Make sure all parameters are defined before using them
      if (!piece || !fromSquare || !toSquare) {
        console.error("Promotion parameters missing:", {
          piece,
          fromSquare,
          toSquare,
        });
        return false;
      }

      // Extract the promotion piece character (q, r, n, b) from the piece name (e.g., 'wQ' -> 'q')
      const promotionPiece = piece.charAt(1).toLowerCase();

      console.log(
        `Promotion move selected: ${fromSquare} to ${toSquare}, promoting to ${promotionPiece}`
      );

      // Create a properly formatted move object with the promotion piece
      const moveWithPromotion = {
        from: fromSquare,
        to: toSquare,
        promotion: promotionPiece,
      };

      // Apply move with requestAnimationFrame to ensure smooth UI
      requestAnimationFrame(() => {
        // Send the move with the promotion piece to the server
        makeMove(moveWithPromotion);
      });

      return true;
    },
    [makeMove]
  );

  // Memoized UI components
  const renderDrawOfferDialog = useCallback(() => {
    if (
      !drawOfferedBy ||
      gameState !== "playing" ||
      playerColor === drawOfferedBy
    ) {
      return null;
    }

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
  }, [drawOfferedBy, gameState, playerColor, acceptDraw, declineDraw]);

  const renderProfileDialog = useCallback(() => {
    return (
      <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-20 p-2 md:p-0">
        <div className="bg-gray-800 p-4 md:p-6 rounded-lg text-center shadow-xl w-full max-w-xs md:max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg md:text-xl font-bold">Your Profile</h3>
            <button
              onClick={() => updateUI({ showProfileDialog: false })}
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
              onClick={() => updateUI({ showProfileDialog: false })}
              color="gray"
              className="flex-1 py-2 md:py-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProfileNameSubmit}
              color="blue"
              className="flex-1 py-2 md:py-3"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }, [profileNameValue, profileNameError, updateUI, handleProfileNameSubmit]);

  // Simple UI elements memoized
  const settingsButton = useMemo(() => {
    if (!showProfileControls) return null;

    return (
      <button
        onClick={() => updateUI({ showProfileDialog: true })}
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
  }, [showProfileControls, updateUI]);

  const playerInfo = useMemo(() => {
    if (!showProfileControls || !playerName) return null;

    return (
      <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-3 py-1 rounded shadow-md z-10">
        <div className="flex items-center">
          <span className="font-medium">Playing as: {playerName}</span>
        </div>
      </div>
    );
  }, [showProfileControls, playerName]);

  const errorMessage = useMemo(() => {
    if (!moveError) return null;

    return (
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-700/90 text-white px-3 py-2 rounded-lg shadow-lg text-xs sm:text-sm md:text-base max-w-[90%] md:max-w-[80%] text-center">
        {moveError}
      </div>
    );
  }, [moveError]);

  // Optimized common board props
  const commonBoardProps = useMemo(
    () => ({
      position: chessboardPosition,
      boardOrientation: playerColor as BoardOrientation,
      customSquareStyles,
      // Remove key from commonBoardProps to avoid React warning
      customBoardStyle: {
        ...chessBoardStyles,
        willChange: "transform, opacity",
      },
      animationDuration: 300,
    }),
    [chessboardPosition, playerColor, customSquareStyles]
  );

  // Render based on game state with transition classes to reduce flicker
  if (gameState === "waiting" && !isWaiting) {
    return (
      <div className="relative w-full h-full transition-opacity duration-300">
        <MemoizedChessboard
          {...commonBoardProps}
          arePiecesDraggable={false}
          autoPromoteToQueen={false}
          promotionDialogVariant="modal"
          customBoardStyle={{
            ...commonBoardProps.customBoardStyle,
            opacity: 0.3,
          }}
        />

        {showNamePrompt && (
          <NamePromptDialog
            nameInputValue={nameInputValue}
            nameInputError={nameInputError}
            onNameChange={setNameInputValue}
            onErrorChange={setNameInputError}
            onSubmit={handleNamePromptSubmit}
          />
        )}

        {showProfileDialog && renderProfileDialog()}
        {playerName && settingsButton}
        {playerInfo}

        <div className="absolute inset-0 bg-gray-800/80 flex items-center justify-center">
          <div className="text-center p-6 flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold mb-6">Checkbro</h2>
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

  if (gameState.startsWith("over")) {
    return (
      <div className="relative w-full h-full transition-opacity duration-300">
        <MemoizedChessboard {...commonBoardProps} arePiecesDraggable={false} />

        {showNamePrompt && (
          <NamePromptDialog
            nameInputValue={nameInputValue}
            nameInputError={nameInputError}
            onNameChange={setNameInputValue}
            onErrorChange={setNameInputError}
            onSubmit={handleNamePromptSubmit}
          />
        )}

        {showProfileDialog && renderProfileDialog()}
        {settingsButton}
        {playerInfo}

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

  if (gameState === "waiting" && isWaiting) {
    return (
      <div className="relative w-full h-full transition-opacity duration-300">
        <MemoizedChessboard
          {...commonBoardProps}
          arePiecesDraggable={false}
          customBoardStyle={{
            ...commonBoardProps.customBoardStyle,
            opacity: 0.3,
          }}
        />

        {showProfileDialog && renderProfileDialog()}
        {settingsButton}
        {playerInfo}

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
    <div className="w-full h-full relative transition-opacity duration-300">
      <div className="w-full h-full">
        <MemoizedChessboard
          position={chessboardPosition}
          boardOrientation={playerColor as BoardOrientation}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            transition: "all 0.3s ease-out",
            willChange: "transform, opacity",
          }}
          onPieceDrop={onDrop}
          autoPromoteToQueen={false}
          promotionDialogVariant="modal"
          onPromotionPieceSelect={handlePromotion}
          snapToCursor={true}
          animationDuration={300}
        />
      </div>

      {showProfileDialog && renderProfileDialog()}
      {errorMessage}
      {renderDrawOfferDialog()}
    </div>
  );
});

export default ChessboardView;
