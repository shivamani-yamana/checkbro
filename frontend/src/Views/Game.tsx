import { Link } from "react-router-dom";
import ChessboardView from "../components/ChessboardView";
import PlayerBoardTray from "../components/PlayerBoardTray";
import PlayerRightPanel from "../components/PlayerRightPanel";
import { GameProvider } from "../contexts/GameContext";

function Game() {
  return (
    <GameProvider>
      <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
        {/* Navigation */}
        <nav className="h-16 bg-gray-900/95 backdrop-blur-sm border-gray-800 p-4 ">
          <div className="h-full max-w-7xl mx-auto px-4">
            <div className="flex items-center h-full">
              <Link
                to="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:cursor-pointer"
              >
                Check bro
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 grid grid-cols-8 gap-4 p-4 pt-0">
          {/* Left Panel - Player Trays */}
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <PlayerBoardTray playerName="User23824" playerType="opponent" />
            </div>
            <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <PlayerBoardTray playerName="You" playerType="you" />
            </div>
          </div>

          {/* Center - Chess Board */}
          <div className="col-span-4">
            {/*  bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 */}
            <div className="relative w-[600px] h-[600px] mx-auto bg-gray-800/50 rounded-xl border border-gray-700/50">
              <ChessboardView />
            </div>
          </div>

          {/* Right Panel - Game Info */}
          <PlayerRightPanel />
        </main>
      </div>
    </GameProvider>
  );
}

export default Game;
