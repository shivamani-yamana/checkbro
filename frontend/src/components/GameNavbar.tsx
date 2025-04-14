import { usePlayerContext } from "@/contexts/PlayerContext";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileDialog from "./ProfileDialog";

export default function GameNavbar() {
  const { playerName } = usePlayerContext();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Add scroll detection for dynamic navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Profile button component
  const renderProfileButton = () => {
    return (
      <button
        onClick={() => setShowProfileDialog(true)}
        className="bg-gray-700/80 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-200 hover:scale-105 shadow-md flex items-center justify-center"
        title="Profile Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 sm:h-6 sm:w-6"
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
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-gray-900/95 shadow-lg" : "bg-gray-900/80"
        } backdrop-blur-md border-b border-gray-800/50`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                to="/"
                className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:cursor-pointer transition-transform hover:scale-105"
              >
                Checkbro
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-4">
                {playerName && (
                  <>
                    <div className="bg-gray-800/80 text-white px-4 py-1.5 rounded-full shadow-md border border-gray-700/50 backdrop-blur-sm">
                      <span className="font-medium text-sm sm:text-base">
                        Playing as:{" "}
                        <span className="text-blue-400">{playerName}</span>
                      </span>
                    </div>
                    {renderProfileButton()}
                  </>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              {playerName ? (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {/* Icon when menu is closed */}
                  <svg
                    className={`${
                      isMobileMenuOpen ? "hidden" : "block"
                    } h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  {/* Icon when menu is open */}
                  <svg
                    className={`${
                      isMobileMenuOpen ? "block" : "hidden"
                    } h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              ) : (
                renderProfileButton()
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800/90 backdrop-blur-md border-t border-gray-700/50 animate-fadeIn">
              {playerName && (
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-white">
                    Playing as:{" "}
                    <span className="text-blue-400">{playerName}</span>
                  </span>
                  {renderProfileButton()}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Add spacer to prevent content from being hidden under the fixed navbar */}
      <div className="h-16"></div>

      {/* Profile dialog */}
      <ProfileDialog
        show={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
      />
    </>
  );
}
