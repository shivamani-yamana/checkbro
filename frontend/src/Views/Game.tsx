import ChessboardView from "../components/ChessboardView";
import PlayerBoardTray from "../components/PlayerBoardTray";
import PlayerRightPanel from "../components/PlayerRightPanel";
import { GameProvider } from "../contexts/GameContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import GameNavbar from "@/components/GameNavbar";

// Create a component inside Game that has access to contexts
const GameContent = () => {
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <GameNavbar />

      {/* Main content */}
      <main className="flex-1 grid grid-cols-8 gap-4 p-4 pt-0">
        {/* Left Panel - Player Trays */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <PlayerBoardTray playerType="opponent" />
          </div>
          <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <PlayerBoardTray playerType="you" />
          </div>
        </div>

        {/* Center - Chess Board */}
        <div className="col-span-4">
          <div className="relative w-[600px] h-[600px] mx-auto bg-gray-800/50 rounded-xl border border-gray-700/50">
            <ChessboardView showProfileControls={false} />
          </div>
        </div>

        {/* Right Panel - Game Info */}
        <PlayerRightPanel />
      </main>
    </div>
  );
};
function Game() {
  return (
    <PlayerProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </PlayerProvider>
  );
}

export default Game;
