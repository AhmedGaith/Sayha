import { useState } from "react";
import { GameProvider, useGame } from "./context/GameContext.jsx";
import Home from "./components/Home.jsx";
import VoiceAssistant from "./components/VoiceAssistant.jsx";
import Missions from "./components/Missions.jsx";
import ScorePanel from "./components/ScorePanel.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import CampingPlanner from "./components/CampingPlanner.jsx";
import VisualIdentifier from "./components/VisualIdentifier.jsx";

/** Top bar with live score — needs game context */
function Shell({ screen, setScreen }) {
  const { points, level } = useGame();

  return (
    <div className="min-h-screen pb-safe" dir="rtl" lang="ar-TN">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -right-10 top-24 text-7xl opacity-10">🧭</div>
        <div className="absolute left-4 top-[30%] text-6xl opacity-10">⛺</div>
        <div className="absolute right-8 top-[54%] text-6xl opacity-10">🗺️</div>
        <div className="absolute left-6 bottom-16 text-7xl opacity-10">🔥</div>
        <div className="absolute right-1/3 bottom-10 text-6xl opacity-10">🎒</div>
      </div>

      <div className="sticky top-0 z-10 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-xl items-center justify-between gap-2 rounded-2xl border border-[#c8b98f66] bg-[#101f16cc] px-3 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <span className="text-lg font-black text-[#ece5c8]">🌲 دليل الكشّاف</span>
        <div className="flex items-center gap-2 rounded-full border border-[#dccd9b66] bg-[#2b3d2d] px-3 py-1 text-sm font-extrabold text-[#f2e4b8] shadow-inner">
          <span>⭐ {points}</span>
          <span className="text-[#cab676]">·</span>
          <span>مستوى {level}</span>
        </div>
      </div>

      {screen === "home" && <Home onNavigate={setScreen} />}
      {screen === "ask" && <VoiceAssistant onBack={() => setScreen("home")} />}
      {screen === "missions" && <Missions onBack={() => setScreen("home")} />}
      {screen === "identify" && <VisualIdentifier onBack={() => setScreen("home")} />}
      {screen === "score" && <ScorePanel onBack={() => setScreen("home")} />}
      {screen === "leaderboard" && <Leaderboard onBack={() => setScreen("home")} />}
      {screen === "camping" && <CampingPlanner onBack={() => setScreen("home")} />}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");

  return (
    <GameProvider>
      <Shell screen={screen} setScreen={setScreen} />
    </GameProvider>
  );
}
