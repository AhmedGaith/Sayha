import { useGame } from "../context/GameContext.jsx";
import { sounds } from "../utils/sounds.js";

/** Mock + localStorage merged list */
export default function Leaderboard({ onBack }) {
  const { leaderboard, points, scoutName } = useGame();

  return (
    <div className="scout-page">
      <button
        type="button"
        onClick={() => {
          sounds.tap();
          onBack();
        }}
        className="scout-wood-btn mb-4"
      >
        ← الرئيسية
      </button>

      <div className="scout-panel">
        <h2 className="scout-title">تقرير الترتيب</h2>
        <p className="scout-subtitle">
          لائحة الأسماء والنقاط في الجهاز هذا ({scoutName || "إنت"}: {points} نقطة)
        </p>

        <ol className="mt-6 space-y-3">
          {leaderboard.map((row, i) => (
            <li
              key={row.id || `${row.name}-${i}`}
              className={`scout-log-card flex items-center justify-between ${
                row.self
                  ? "ring-2 ring-[#3f6f54aa]"
                  : "ring-1 ring-[#8f735377]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7a624666] bg-[#f5ecd2] text-lg font-black text-[#4b3a27] shadow">
                  {i + 1}
                </span>
                <span className="text-lg font-black text-[#2f261b]">
                  {row.name}
                  {row.self ? " (إنت)" : ""}
                </span>
              </div>
              <span className="rounded-xl border border-[#71593e66] bg-[#e5d4aa] px-3 py-1 text-lg font-black text-[#59432c]">
                {row.score}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
