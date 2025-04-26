import { useEffect, useState, useRef } from "react";
import { useGameContext } from "../contexts/GameContext";
import { RECONNECTION_TOKEN, RECONNECTION_TOKEN_EXPIRY } from "@/lib/messages";
import Spinner from "./ui/Spinner";

export const ReconnectionStatus: React.FC = () => {
  const { reconnect, isReconnecting } = useGameContext();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(60); // Default value
  const [showManualReconnect, setShowManualReconnect] = useState(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the timers when component unmounts or reconnection state changes
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Control visibility and manage countdown timer
  useEffect(() => {
    const token = localStorage.getItem(RECONNECTION_TOKEN);
    const expiry = Number(localStorage.getItem(RECONNECTION_TOKEN_EXPIRY));

    if (!token || !expiry) {
      // If no token, make sure we're not showing reconnecting state
      if (isReconnecting) {
        console.log(
          "No reconnection token but reconnecting state is true - resetting"
        );
      }
      return;
    }

    // Calculate initial total duration
    const now = Date.now();
    const initialRemaining = Math.max(0, Math.floor((expiry - now) / 1000));
    setTotalSeconds(initialRemaining);
    setTimeRemaining(initialRemaining);

    // After a few seconds with no automatic reconnection, show manual option
    reconnectTimerRef.current = setTimeout(() => {
      if (isReconnecting) {
        setShowManualReconnect(true);
      }
    }, 5000);

    // Start countdown timer
    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        setShowManualReconnect(false);
      }
    }, 1000);

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isReconnecting]);

  // Don't render if no reconnection is happening
  if (!isReconnecting) {
    // console.log(
    //   "Not rendering ReconnectionStatus because isReconnecting is false"
    // );
    return null;
  }

  console.log(
    "Rendering ReconnectionStatus with isReconnecting:",
    isReconnecting
  );

  // Show automatic reconnection UI
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 mr-3">
          <Spinner color="#3b82f6" />
        </div>
        <h3 className="text-xl font-bold">Reconnecting to your game...</h3>
      </div>

      {timeRemaining > 0 && (
        <>
          <p className="text-gray-400 mb-2 text-sm">
            Reconnection available for {timeRemaining} seconds
          </p>
          <div className="w-full bg-gray-700 h-1.5 mb-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${(timeRemaining / totalSeconds) * 100}%` }}
            ></div>
          </div>
        </>
      )}

      {showManualReconnect && (
        <div className="mt-4">
          <p className="mb-3 text-gray-300">
            Taking longer than expected? Try manual reconnection:
          </p>
          <div className="flex space-x-4">
            <button
              onClick={reconnect}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded"
            >
              Reconnect Now
            </button>
            <button
              onClick={() => {
                // Clear token and dismiss
                localStorage.removeItem(RECONNECTION_TOKEN);
                localStorage.removeItem(RECONNECTION_TOKEN_EXPIRY);
                window.location.href = "/"; // Redirect to home
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
