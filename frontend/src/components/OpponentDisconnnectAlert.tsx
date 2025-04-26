import { useEffect } from "react";
import { useGameContext } from "@/contexts/GameContext";

function OpponentDisconnnectAlert() {
  const {
    isOpponentDisconnected,
    setIsOpponentDisconnected,
    opponentDisconnectTime,
    opponentTimeRemaining,
    setOpponentTimeRemaining,
    reconnectionWindowSeconds,
  } = useGameContext();

  useEffect(() => {
    if (!opponentDisconnectTime || !isOpponentDisconnected) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() -
          (opponentDisconnectTime
            ? Number(opponentDisconnectTime)
            : Date.now())) /
          1000
      );
      const remaining = Math.max(0, reconnectionWindowSeconds - elapsed);
      setOpponentTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsOpponentDisconnected(false);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isOpponentDisconnected,
    opponentDisconnectTime,
    reconnectionWindowSeconds,
    setIsOpponentDisconnected,
    setOpponentTimeRemaining,
  ]);

  // Don't render anything if opponent is not disconnected
  if (!isOpponentDisconnected) return null;

  return (
    <div className="bg-yellow-900/90 border border-yellow-600 p-3 rounded-lg shadow-lg max-w-xs">
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm font-medium">
          Opponent disconnected! Waiting for reconnection...
        </p>
      </div>
      <div className="mt-2 text-xs text-yellow-300">
        {opponentTimeRemaining > 0 ? (
          <span>Time remaining: {opponentTimeRemaining}s</span>
        ) : (
          <span>Connection window expired</span>
        )}
      </div>
      <div className="w-full bg-gray-700 h-1.5 mt-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-500"
          style={{
            width: `${
              (opponentTimeRemaining / reconnectionWindowSeconds) * 100
            }%`,
          }}
        ></div>
      </div>
    </div>
  );
}

export default OpponentDisconnnectAlert;
