import { PlayerContextType } from "@/types/Types";
import { createContext, useContext, useEffect, useState } from "react";

const PLAYER_NAME_STORAGE_KEY = "chess_player_name";

const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (context === null) {
    throw new Error("usePlayerContext must be used within PlayerProvider");
  }
  return context;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playerName, setPlayerName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
      return savedName || null;
    }
    return null;
  });

  useEffect(() => {
    if (playerName) {
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, playerName);
    }
  }, [playerName]);

  const declarePlayerName = (name: string) => {
    setPlayerName(name);
  };

  const clearPlayerName = () => {
    setPlayerName(null);
    localStorage.removeItem(PLAYER_NAME_STORAGE_KEY);
  };

  const setShowProfileDialog = (value: boolean) => {
    setShowProfileDialog(value);
  };
  const values: PlayerContextType = {
    playerName,
    declarePlayerName,
    clearPlayerName,
    setShowProfileDialog,
  };
  return (
    <PlayerContext.Provider value={values}>{children}</PlayerContext.Provider>
  );
};
