// Updated LandingPage.tsx content
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    // Simulate loading for animation
    setTimeout(() => setIsLoaded(true), 100);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Background gradient ornaments */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 -left-64 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -right-64 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Floating chess pieces as background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 text-8xl animate-float-slow">
          ♟
        </div>
        <div className="absolute top-2/3 left-1/3 text-7xl animate-float-medium">
          ♞
        </div>
        <div className="absolute top-1/3 right-1/4 text-9xl animate-float-fast">
          ♜
        </div>
        <div className="absolute bottom-1/4 right-1/3 text-8xl animate-float-medium">
          ♝
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-gray-900/95 backdrop-blur-md shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center">
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Checkbro
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="hidden md:flex items-center space-x-1">
              <a
                href="#features"
                className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#development"
                className="px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Development Status
              </a>
              <button
                onClick={() => navigate("/game")}
                className="ml-4 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium transition-all hover:shadow-lg"
              >
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center md:justify-between gap-12">
              {/* Left side - Content */}
              <div
                className={`flex-1 space-y-6 md:space-y-8 transition-all duration-700 ${
                  isLoaded
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-10 opacity-0"
                }`}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                  Play chess{" "}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                      in development
                    </span>
                    <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></span>
                  </span>
                </h1>

                <p className="text-lg text-gray-300 max-w-lg">
                  Checkbro is currently in early development. Try our prototype
                  with basic 1v1 gameplay, captured piece tracking, and game
                  controls.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-8 py-4 rounded-lg text-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-600/20"
                    onClick={() => navigate("/game")}
                  >
                    Try Demo
                  </button>
                  <a
                    href="#development"
                    className="bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-lg text-lg font-medium transition-colors text-center"
                  >
                    Development Status
                  </a>
                </div>

                {/* Development badge */}
                <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-4 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-300">
                    In Active Development
                  </span>
                </div>
              </div>

              {/* Right side - Image with floating effect */}
              <div
                className={`flex-1 transition-all duration-1000 delay-300 ${
                  isLoaded
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
              >
                <div className="relative aspect-square max-w-md mx-auto md:ml-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl blur-xl transform -rotate-6 scale-95"></div>
                  <img
                    src="/chess_img.jpg"
                    alt="Chess game"
                    className="relative z-10 rounded-2xl shadow-2xl transform transition-transform hover:scale-[1.02] duration-500 w-full h-full object-cover"
                  />

                  {/* Floating shapes */}
                  <div className="absolute -top-6 -left-6 w-12 h-12 bg-blue-500 rounded-xl animate-float-slow"></div>
                  <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-purple-500 rounded-full animate-float-medium"></div>
                  <div className="absolute top-1/2 -right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg animate-float-fast"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Only showing implemented features */}
        <section id="features" className="py-16 md:py-24 bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Current Features
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Our platform is under development, but you can already try these
                working features:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1 border border-gray-700/50">
                <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-time Chess</h3>
                <p className="text-gray-400">
                  Play a complete game of chess against the next person who
                  joins. Full chess rules including castling, en passant, and
                  promotions.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1 border border-gray-700/50">
                <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Captured Pieces Tracking
                </h3>
                <p className="text-gray-400">
                  See which pieces you've captured and their material value.
                  Keep track of the material advantage in real time.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm transition-all hover:shadow-lg hover:-translate-y-1 border border-gray-700/50">
                <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Game Controls</h3>
                <p className="text-gray-400">
                  Resign from the game or offer a draw to your opponent. Full
                  move history panel to keep track of all moves.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Development Status Section */}
        <section id="development" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Development Status
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Checkbro is an early-stage project. Here's our current status
                and what's coming next.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <h3 className="text-xl font-bold">Completed</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Basic matchmaking system
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Complete chess rules implementation
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Captured pieces tracking
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Move history panel
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Resign & draw offers
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <h3 className="text-xl font-bold">In Progress</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Game clock implementation
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    UI/UX improvements
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Improved user profiles
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <h3 className="text-xl font-bold">Coming Soon</h3>
                </div>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    Matchmaking and rating system
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    In-game chat functionality
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    Game analysis tools
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    Mobile optimization
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              </div>

              <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Want to try the prototype?
                  </h2>
                  <p className="text-blue-100 mb-0 md:max-w-lg">
                    You'll need two browser windows to play against yourself
                    during development, or try to match with another tester!
                  </p>
                </div>
                <button
                  className="px-8 py-4 rounded-lg bg-white text-blue-600 hover:bg-blue-50 font-medium text-lg whitespace-nowrap transition-all hover:shadow-lg"
                  onClick={() => navigate("/game")}
                >
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
              Checkbro
            </div>
            <p className="text-gray-400 max-w-lg mx-auto">
              This is a development prototype. Not all features are implemented
              yet.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              &copy; 2025 Checkbro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
