import { useGameContext } from "../contexts/GameContext";
import { useEffect, useRef } from "react";
import { ChessMovesHistoryType } from "../types/Types";

interface PlayerRightPanelProps {
  isMobile?: boolean;
  onClose?: () => void;
}

function PlayerRightPanel({
  isMobile = false,
  onClose,
}: PlayerRightPanelProps) {
  const { gameState, resign, moveHistory, offerDraw } = useGameContext();
  const historyContainerRef = useRef<HTMLDivElement>(null);

  const formatSingleMove = (move: ChessMovesHistoryType) => {
    // Get piece symbol for display
    const pieceSymbol = getPieceSymbol(move.piece);

    // For captures, you might want to use 'x' instead of '-'
    const notation = move.flags.includes("c")
      ? `${move.from}x${move.to}`
      : `${move.from}-${move.to}`;

    return `${pieceSymbol} ${notation}`;
  };

  const getPieceSymbol = (piece: string) => {
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

  // Format moveHistory into move pairs (white and black moves)
  const formatHistory = () => {
    const formattedHistory = [];

    for (let i = 0; i < moveHistory.length; i += 2) {
      const whiteMove = moveHistory[i];
      const blackMove = i + 1 < moveHistory.length ? moveHistory[i + 1] : null;

      formattedHistory.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: whiteMove ? formatSingleMove(whiteMove) : "",
        black: blackMove ? formatSingleMove(blackMove) : "",
        whiteCapture: whiteMove && whiteMove.flags.includes("c"),
        blackCapture: blackMove && blackMove.flags.includes("c"),
      });
    }

    return formattedHistory;
  };

  // Update scroll when new moves are added
  useEffect(() => {
    if (historyContainerRef.current && moveHistory.length > 0) {
      historyContainerRef.current.scrollTop =
        historyContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

  return (
    <div
      className={`${
        isMobile
          ? "bg-gray-800 border-t border-gray-700"
          : "bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50"
      } p-4 flex flex-col h-full transition-all duration-300`}
    >
      {/* Mobile header with close button */}
      {isMobile && (
        <div className="mb-4">
          <div className="flex items-center justify-between w-full pb-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Game Info</h2>
            </div>

            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              title="Close panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Game Info</h2>
        </div>
      )}

      <div className={`${isMobile ? "flex-1 overflow-hidden" : "space-y-4"}`}>
        {/* Move History */}
        <div
          className={`${
            isMobile
              ? "flex-1"
              : "p-4 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
          }`}
        >
          {!isMobile && (
            <h3 className="font-medium mb-3 text-gray-300">Move History</h3>
          )}

          <div
            ref={historyContainerRef}
            className={`${
              isMobile ? "h-[calc(60vh-220px)]" : "h-[calc(100vh-22rem)]"
            } overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent`}
          >
            {moveHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 px-4">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-gray-400">No moves yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Moves will appear here as the game progresses
                </p>
              </div>
            ) : (
              <table className="w-full text-gray-300 text-sm">
                <thead className="text-xs uppercase text-gray-500 border-b border-gray-700/50">
                  <tr>
                    <th className="py-2 px-3 text-left">#</th>
                    <th className="py-2 px-3 text-left">White</th>
                    <th className="py-2 px-3 text-left">Black</th>
                  </tr>
                </thead>
                <tbody>
                  {formatHistory().map((pair) => (
                    <tr
                      key={`move-${pair.moveNumber}`}
                      className={`transition-colors ${
                        moveHistory.length / 2 === pair.moveNumber ||
                        Math.ceil(moveHistory.length / 2) === pair.moveNumber
                          ? "bg-blue-900/10 border-l-2 border-blue-500"
                          : "hover:bg-gray-700/20"
                      }`}
                    >
                      <td className="py-2 px-3 text-gray-500">
                        {pair.moveNumber}.
                      </td>
                      <td
                        className={`py-2 px-3 font-mono ${
                          pair.whiteCapture ? "text-red-400" : ""
                        }`}
                      >
                        {pair.white}
                      </td>
                      <td
                        className={`py-2 px-3 font-mono ${
                          pair.blackCapture ? "text-red-400" : ""
                        }`}
                      >
                        {pair.black}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Game Controls - only show if game is in progress */}
        {gameState === "playing" && (
          <div className="mt-4">
            <h3 className="font-medium mb-3 text-gray-300">Game Controls</h3>
            <div className="flex gap-3">
              <button
                onClick={resign}
                className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
              >
                Resign
              </button>
              <button
                onClick={offerDraw}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:shadow-lg"
              >
                Offer Draw
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerRightPanel;
