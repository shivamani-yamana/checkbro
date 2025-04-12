import Button from "./Button";
import { useGameContext } from "../contexts/GameContext";
import { useEffect, useRef } from "react";
import { ChessMovesHistoryType } from "../types/Types";

function PlayerRightPanel() {
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
    if (historyContainerRef.current) {
      historyContainerRef.current.scrollTop =
        historyContainerRef.current.scrollHeight;
    }
  }, [moveHistory]);

  return (
    <div className="col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col justify-around">
      <h2 className="text-xl font-bold mb-4">Game Info</h2>
      <div className="space-y-4">
        {/* Move moveHistory Part here */}
        <div className="p-3 rounded-lg bg-gray-800/50">
          {" "}
          {/* Instead of bg-emerald-200 */}
          <h3 className="font-medium mb-2">Move History</h3>
          <div
            ref={historyContainerRef}
            className="h-[calc(100vh-20rem)] overflow-y-auto"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-300 border-b border-gray-700">
                  <th className="w-12 text-left pb-2">#</th>
                  <th className="w-1/2 text-left pb-2">White</th>
                  <th className="w-1/2 text-left pb-2">Black</th>
                </tr>
              </thead>
              <tbody>
                {formatHistory().map((pair) => (
                  <tr
                    key={`move-${pair.moveNumber}`}
                    className={`hover:bg-gray-700/30 ${
                      moveHistory.length / 2 === pair.moveNumber ||
                      Math.ceil(moveHistory.length / 2) === pair.moveNumber
                        ? "bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <td className="py-1 text-gray-500">{pair.moveNumber}.</td>
                    <td
                      className={`py-1 font-mono ${
                        pair.whiteCapture ? "text-red-400" : ""
                      }`}
                    >
                      {pair.white}
                    </td>
                    <td
                      className={`py-1 font-mono ${
                        pair.blackCapture ? "text-red-400" : ""
                      }`}
                    >
                      {pair.black}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Game Controls - only show if game is in progress */}
        {gameState === "playing" && (
          <div className="flex gap-2">
            <Button onClick={resign} color="rose">
              Resign
            </Button>
            <Button onClick={offerDraw} color="gray">
              Draw
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerRightPanel;
