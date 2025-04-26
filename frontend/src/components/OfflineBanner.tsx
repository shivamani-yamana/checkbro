// src/components/OfflineBanner.tsx
import React from "react";
import { useGameContext } from "@/contexts/GameContext";

const OfflineBanner: React.FC = () => {
  const { isOnline, reconnect } = useGameContext();

  if (isOnline) return null;

  return (
    <div className="fixed top-12 inset-x-0 flex justify-center z-50 animate-fade-in">
      <div className="bg-red-800 text-white px-4 py-2 rounded-b-lg shadow-lg flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>You're offline</span>
        <button
          onClick={reconnect}
          className="ml-2 bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-sm"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
