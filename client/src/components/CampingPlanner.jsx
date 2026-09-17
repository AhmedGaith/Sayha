import { useState } from "react";
import { sounds } from "../utils/sounds.js";
import { isOfflineFetchError } from "../utils/networkError.js";
import { apiUrl } from "../utils/api.js";

const OFFLINE_HINT_AR =
  "تعذّر الاتصال بالخادم. من مجلد المشروع شغّل npm run dev وانتظر حتى يعمل الموقع والخادم معاً، ثم افتح http://localhost:5173";

/**
 * Form → POST /api/camping-plan → short kid tips as { icon, text } rows.
 */
export default function CampingPlanner({ onBack }) {
  const [location, setLocation] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [status, setStatus] = useState("idle");
  const [bullets, setBullets] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loc = location.trim();
    const period = timePeriod.trim();
    if (!loc || !period) {
      setErrorMsg("اكتب المكان ومتى تروح (مع كبير!).");
      sounds.error();
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    setBullets([]);
    sounds.tap();
    try {
      const res = await fetch(apiUrl("/api/camping-plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: loc, timePeriod: period }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" && data.error.trim()
            ? data.error.trim()
            : "تعذّر إنشاء الخطة. حاول مرة أخرى!",
        );
      }
      const list = Array.isArray(data.bullets) ? data.bullets : [];
      if (list.length === 0) {
        throw new Error("لم تظهر نصائح. حاول مرة أخرى!");
      }
      setBullets(list);
      setStatus("done");
      sounds.success();
    } catch (err) {
      setErrorMsg(
        isOfflineFetchError(err) ? OFFLINE_HINT_AR : err.message || "حدث خطأ. حاول مرة أخرى!",
      );
      setStatus("error");
      sounds.error();
    }
  };

  return (
    <div className="scout-page" dir="rtl" lang="ar">
      <button
        type="button"
        onClick={() => {
          sounds.tap();
          onBack();
        }}
        className="scout-wood-btn mb-4"
      >
        الرئيسية ←
      </button>

      <div className="scout-panel">
        <h2 className="scout-title">تقرير تجهيز التخييم</h2>
        <p className="scout-subtitle">
          نصايح بسيطة وساهلة — ديما مع كبير
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-black text-[#3c5c45]">🗺️ وين باش تمشي؟</span>
            <input
              type="text"
              value={location}
              onChange={(ev) => setLocation(ev.target.value)}
              placeholder="مثال: الحديقة، الجبل، الغابة…"
              className="scout-field mt-1"
              maxLength={200}
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-sm font-black text-[#3c5c45]">⏳ وقتاش؟</span>
            <input
              type="text"
              value={timePeriod}
              onChange={(ev) => setTimePeriod(ev.target.value)}
              placeholder="مثال: نهار واحد، الصيف، آخر الأسبوع…"
              className="scout-field mt-1"
              maxLength={200}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="scout-badge-btn disabled:opacity-60"
          >
            {status === "loading" ? "نحضّر لك…" : "ورّيني النصائح!"}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-100/90 p-4 text-center text-base font-bold text-rose-900 shadow">
            {errorMsg}
          </div>
        )}

        {bullets.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-center text-sm font-black text-[#315441]">📒 تقرير الكشّاف</p>
            <ul className="flex max-h-[min(70vh,36rem)] flex-col gap-3 overflow-y-auto pr-0.5">
              {bullets.map((b, i) => {
                const icon = typeof b?.icon === "string" && b.icon.trim() ? b.icon.trim() : "⭐";
                const text = typeof b?.text === "string" ? b.text : "";
                return (
                  <li
                    key={`${i}-${text.slice(0, 12)}`}
                    className="scout-log-card flex items-center gap-3"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#89a88166] bg-[#d4e0c9] text-4xl leading-none shadow-inner">
                      {icon}
                    </span>
                    <p className="min-w-0 flex-1 text-right text-lg font-black leading-snug text-[#2f261b]">
                      {text}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
