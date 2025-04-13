import { usePlayerContext } from "@/contexts/PlayerContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import ProfileDialog from "./ProfileDialog";

export default function GameNavbar() {
  const { playerName } = usePlayerContext();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Profile button component
  const renderProfileButton = () => {
    return (
      <button
        onClick={() => setShowProfileDialog(true)}
        className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 shadow-md"
        title="Profile Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>
    );
  };

  return (
    <>
      <nav className="h-16 bg-gray-900/95 backdrop-blur-sm border-gray-800 p-4">
        <div className="h-full max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-full">
            {/* Logo on left */}
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:cursor-pointer"
            >
              Check bro
            </Link>

            {/* Player info on right */}
            {playerName && (
              <div className="flex items-center space-x-4">
                <div className="bg-gray-800/80 text-white px-4 py-1.5 rounded-md shadow-md">
                  <span className="font-medium">Playing as: {playerName}</span>
                </div>
                {renderProfileButton()}
              </div>
            )}
          </div>
        </div>
      </nav>
      {/* Add the profile dialog */}
      <ProfileDialog
        show={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
    </>
  );
}
