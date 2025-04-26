import ChessboardView from "../components/ChessboardView";
import PlayerBoardTray from "../components/PlayerBoardTray";
import PlayerRightPanel from "../components/PlayerRightPanel";
import { GameProvider } from "../contexts/GameContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import GameNavbar from "@/components/GameNavbar";
import { useState } from "react";
import { ReconnectionStatus } from "@/components/ReconnectionStatus";
import OpponentDisconnnectAlert from "@/components/OpponentDisconnnectAlert";
import OfflineBanner from "@/components/OfflineBanner";

// Create a component inside Game that has access to contexts
const GameContent = () => {
  // State to track if the mobile info panel is expanded
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <GameNavbar />

      <OfflineBanner />

      {/* Notification container - positioned absolutely */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* ReconnectionStatus is centered */}
        <div className="h-full flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <ReconnectionStatus />
          </div>
        </div>

        {/* OpponentDisconnectAlert goes in top-right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <OpponentDisconnnectAlert />
        </div>
      </div>

      {/* Main content - chess.com inspired responsive layout */}
      <main className="flex-1 flex flex-col md:grid md:grid-cols-8 md:gap-4">
        {/* Mobile-only top player tray - like chess.com */}
        <div className="block md:hidden w-full">
          <div className="bg-gray-800/70 backdrop-blur-sm border-b border-gray-700/50 p-1">
            <PlayerBoardTray playerType="opponent" />
          </div>
        </div>

        {/* Sidebar - hidden on mobile, visible on desktop */}
        <div className="hidden md:flex md:col-span-2 md:flex-col md:gap-4 md:p-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 md:flex-1">
            <PlayerBoardTray playerType="opponent" />
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 md:flex-1">
            <PlayerBoardTray playerType="you" />
          </div>
        </div>

        {/* Center - Chess Board */}
        <div className="w-full flex-1 md:col-span-4 flex flex-col">
          {/* Board container - taking full width on mobile */}
          <div className="relative flex-1 flex items-center justify-center">
            <div className="relative aspect-square w-full max-h-[calc(100vh-120px)] md:max-w-[min(80vh,600px)] bg-gray-800/50 rounded-md md:rounded-xl border border-gray-700/50">
              <ChessboardView showProfileControls={false} />
            </div>
          </div>

          {/* Mobile-only bottom player tray - like chess.com */}
          <div className="block md:hidden w-full">
            <div className="bg-gray-800/70 backdrop-blur-sm border-t border-gray-700/50 p-1">
              <PlayerBoardTray playerType="you" />
            </div>
          </div>
        </div>

        {/* Right Panel - Game Info */}
        <div className="md:col-span-2 md:p-4">
          {/* Mobile: Collapsible panel with tab */}
          <div className="block md:hidden">
            <button
              onClick={() => setShowMobileInfo(!showMobileInfo)}
              className="w-full bg-gray-800 border-t border-gray-700 py-1 flex items-center justify-center"
            >
              <span className="mr-2 text-sm font-medium">Game Info</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  showMobileInfo ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>

            {/* Slide-up panel with move history */}
            <div
              className={`fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 transition-transform duration-300 ease-in-out z-30 ${
                showMobileInfo ? "translate-y-0" : "translate-y-full"
              }`}
              style={{ height: "60vh" }}
            >
              <PlayerRightPanel
                isMobile={true}
                onClose={() => setShowMobileInfo(false)}
              />
            </div>
          </div>

          {/* Desktop: Always visible panel */}
          <div className="hidden md:block h-full">
            <PlayerRightPanel isMobile={false} />
          </div>
        </div>
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
