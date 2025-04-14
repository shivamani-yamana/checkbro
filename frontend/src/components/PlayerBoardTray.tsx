import { useEffect, useState } from "react";
import { useGameContext } from "../contexts/GameContext";
import { usePlayerContext } from "@/contexts/PlayerContext";
import type { CapturedPiece } from "@/types/Types";

function PlayerBoardTray({ playerType }: { playerType: "you" | "opponent" }) {
  const { gameState, playerColor, currentTurn, opponentName, capturedPieces } =
    useGameContext();
  const { playerName } = usePlayerContext();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (gameState !== "playing") {
      setIsActive(false);
      return;
    }

    if (
      (playerType === "you" && playerColor === currentTurn) ||
      (playerType === "opponent" && playerColor !== currentTurn)
    ) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [gameState, playerType, playerColor, currentTurn]);

  // Determine display name based on player type
  const displayName =
    playerType === "you" ? playerName || "You" : opponentName || "Opponent";

  // Get captured pieces for this player type
  const relevantCapturedPieces =
    playerType === "you" ? capturedPieces.byPlayer : capturedPieces.byOpponent;

  // Render chess piece symbols
  const renderPieceSymbol = (piece: string) => {
    const symbols: Record<string, string> = {
      p: "♟",
      n: "♞",
      b: "♝",
      r: "♜",
      q: "♛",
      k: "♚",
    };
    return symbols[piece.toLowerCase()] || "";
  };

  const hasCapturedPieces = relevantCapturedPieces.length > 0;

  // Calculate material advantage based on piece values
  const getMaterialValue = (pieces: CapturedPiece[]): number => {
    const pieceValues: Record<string, number> = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
      k: 0,
    };
    return pieces.reduce((total, piece) => {
      return total + (pieceValues[piece.type] || 0) * piece.count;
    }, 0);
  };

  const capturedValue = getMaterialValue(relevantCapturedPieces);

  return (
    <div className="w-full bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/50 transition-all duration-300 hover:bg-gray-800/90">
      {/* Single row layout for all devices */}
      <div className="flex items-center justify-between px-2 py-2 sm:px-4 sm:py-3">
        {/* Player info with avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            {/* Gradient background for avatar */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full blur-[2px] opacity-80"></div>

            {/* Player avatar */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 flex items-center justify-center rounded-full border-2 border-white/20 shadow-lg">
              <span className="text-lg sm:text-xl">♚</span>
            </div>

            {/* Active indicator dot */}
            {isActive && (
              <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-800 animate-pulse"></div>
            )}
          </div>

          {/* Player name and color */}
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="font-medium text-sm truncate max-w-[80px] sm:max-w-full">
                {displayName}
              </span>
            </div>
            {gameState === "playing" && (
              <span className="text-xs text-gray-400">
                {playerType === "you" ? playerColor : ""}
              </span>
            )}
          </div>
        </div>

        {/* Middle: Captured pieces section */}
        <div className="flex-1 flex justify-center items-center px-1 sm:px-3">
          {gameState === "playing" && (
            <div className="flex items-center space-x-1">
              {hasCapturedPieces ? (
                <>
                  {/* Only show up to 3 pieces on mobile, full list on desktop */}
                  <div className="flex items-center">
                    {relevantCapturedPieces.slice(0, 3).map((piece, index) => (
                      <div
                        key={`${piece.type}-${index}`}
                        className="relative group -ml-1 first:ml-0"
                      >
                        <div className="bg-gray-700/40 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border border-gray-600/30">
                          <span className="text-base sm:text-lg">
                            {renderPieceSymbol(piece.type)}
                          </span>
                        </div>

                        {piece.count > 1 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center text-[10px] border border-gray-600">
                            {piece.count}
                          </div>
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {piece.count}{" "}
                          {piece.type === "p"
                            ? "Pawn"
                            : piece.type === "n"
                            ? "Knight"
                            : piece.type === "b"
                            ? "Bishop"
                            : piece.type === "r"
                            ? "Rook"
                            : piece.type === "q"
                            ? "Queen"
                            : "King"}
                          {piece.count > 1 ? "s" : ""}
                        </div>
                      </div>
                    ))}

                    {/* Show +X more indicator if there are more pieces */}
                    {relevantCapturedPieces.length > 3 && (
                      <div className="text-xs text-gray-400 ml-1">
                        +{relevantCapturedPieces.length - 3}
                      </div>
                    )}

                    {/* Material advantage */}
                    {capturedValue > 0 && (
                      <span
                        className={`ml-1 text-xs px-1 py-0.5 rounded font-medium ${
                          playerType === "you"
                            ? "text-green-400"
                            : "text-rose-400"
                        }`}
                      >
                        +{capturedValue}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-500 italic">
                  No captures
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side: Status indicator */}
        <div className="flex items-center">
          {gameState === "playing" && (
            <div
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-gray-700/50 text-gray-300"
              } whitespace-nowrap transition-all duration-300`}
            >
              {isActive ? "Active" : "Waiting"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerBoardTray;
