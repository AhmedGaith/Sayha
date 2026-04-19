import { useEffect, useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { POINTS_PER_LEVEL, pointsToNextLevel } from "../utils/missions.js";
import { sounds } from "../utils/sounds.js";

/** Points, level, next-level hint, scout name */
export default function ScorePanel({ onBack }) {
  const { points, level, scoutName, setScoutName } = useGame();
  const [draft, setDraft] = useState(scoutName);
  const need = pointsToNextLevel(points);

  useEffect(() => {
    setDraft(scoutName);
  }, [scoutName]);

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
        <h2 className="scout-title">سجل النقاط</h2>

        <div className="mt-6 rounded-3xl border border-[#7e674866] bg-gradient-to-br from-[#ead9b2] via-[#dec693] to-[#c7a778] p-6 text-center shadow-[inset_0_1px_0_rgba(255,245,210,0.65),0_10px_18px_rgba(0,0,0,0.16)]">
          <p className="text-sm font-black tracking-wide text-[#5d452f]">
            نقاط الكشّاف
          </p>
          <p className="mt-1 text-6xl font-black text-[#422d1d]">{points}</p>
          <p className="mt-3 text-xl font-black text-[#5e4027]">المستوى {level}</p>
          <p className="mt-2 text-sm font-bold text-[#64482f]">
            {need === POINTS_PER_LEVEL
              ? `كل ${POINTS_PER_LEVEL} نقطة = مستوى جديد!`
              : `باقيلك ${need} نقطة للمستوى ${level + 1}`}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[#90704d66] bg-[#efe3c6] p-4 shadow-inner">
          <label className="block text-sm font-black text-[#5f472f]" htmlFor="scout-name">
            إسمك في الترتيب
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="scout-name"
              maxLength={24}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="مثال: الثعلب الشاطر"
              className="scout-field min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => {
                sounds.tap();
                setScoutName(draft);
              }}
              className="scout-wood-btn rounded-xl"
            >
              أحفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
