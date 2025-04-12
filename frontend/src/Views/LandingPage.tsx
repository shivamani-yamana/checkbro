import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Check bro
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="relative">
          <section className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="flex items-center justify-between gap-12">
                {/* Left side - Image */}
                <div className="flex-1">
                  <img
                    src="/chess_img.jpg"
                    alt="Chess game"
                    className="w-auto rounded-lg shadow-2xl"
                  />
                </div>

                {/* Right side - Content */}
                <div className="flex-1 space-y-8">
                  <h1 className="text-5xl font-bold">
                    Ready to
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                      {" "}
                      play chess?
                    </span>
                  </h1>
                  <div className="flex flex-col gap-4">
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg text-xl font-medium transition-colors"
                      onClick={() => navigate("/game")}
                    >
                      Play Now
                    </button>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
                      <h3 className="text-lg font-semibold mb-2">
                        Quick Match
                      </h3>
                      <p className="text-sm text-gray-400">
                        Jump into a game instantly with players of similar skill
                        level.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
                      <h3 className="text-lg font-semibold mb-2">
                        Custom Games
                      </h3>
                      <p className="text-sm text-gray-400">
                        Set your own time controls and challenge specific
                        players.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors">
                      <h3 className="text-lg font-semibold mb-2">
                        Real-time Chat
                      </h3>
                      <p className="text-sm text-gray-400">
                        Communicate with your opponent during matches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Check bro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
