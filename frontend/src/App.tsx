import { Routes, Route, BrowserRouter } from "react-router-dom";
import "./App.css";
import LandingPage from "./Views/LandingPage";
import Game from "./Views/Game";

function App() {
  return (
    <>
      <div className="w-full h-screen min-h-screen bg-gray-900 text-white">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

export default App;
