import { useEffect, useState } from "react";
import { useGameContext } from "../contexts/GameContext";
function PlayerBoardTray({
  playerName,
  playerType,
}: {
  playerName: string;
  playerType: "you" | "opponent";
}) {
  const { gameState, playerColor, currentTurn } = useGameContext();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    console.log("PlayerBoardTray updated:", playerType, playerColor);
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

  return (
    <div className="w-full bg-gray-800 h-12">
      <div className="w-full h-full flex items-center justify-between px-4">
        {/* Player name and icon here */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-full shadow-lg stroke-white stroke-2">
            <img src="/user.png" alt="Chess game" className="h-10 shadow-2xl" />
          </div>
          <div>
            {" "}
            {playerName}
            {gameState === "playing" && playerType === "you" && (
              <span className="ml-2 text-sm text-gray-400">
                (Playing as {playerColor})
              </span>
            )}
            {/* Player tray here */}
            {isActive && (
              <div className="animate-pulse rounded-full w-3 h-3 bg-blue-500"></div>
            )}
          </div>
        </div>

        {/* Player tray here */}
      </div>
    </div>
  );
}

export default PlayerBoardTray;
