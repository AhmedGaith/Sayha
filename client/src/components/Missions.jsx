import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import { compressImageToJpeg } from "../utils/compressImage.js";
import { sounds } from "../utils/sounds.js";
import { isOfflineFetchError, offlineFetchHint } from "../utils/networkError.js";

/** Mission cards — complete with a photo checked by the server (vision). */
export default function Missions({ onBack }) {
  const { missions, completed, completeMission } = useGame();
  const fileRef = useRef(null);

  const [openMission, setOpenMission] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  const closeModal = useCallback(() => {
    setOpenMission(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setPayload(null);
    setHint("");
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setHint("إختر تصويرة (PNG ولا JPG عادي).");
      return;
    }
    setHint("قاعدين نحضّرو في التصويرة…");
    try {
      const { base64, mimeType } = await compressImageToJpeg(file);
      setPayload({ base64, mimeType });
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      setHint("باهية! إضغط على إرسال التصويرة باش صديق الكشّاف يشيّك.");
      sounds.tap();
    } catch {
      setHint("الملف هذا ما خدمش. جرّب تصويرة أخرى.");
      sounds.error();
    }
  };

  const sendPhoto = async () => {
    if (!openMission || !payload) {
      setHint("إختر تصويرة قبل.");
      return;
    }
    setBusy(true);
    setHint("قاعدين نشيّكو في التصويرة…");
    try {
      const res = await fetch("/api/verify-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: openMission.id,
          missionTarget: openMission.title,
          imageBase64: payload.base64,
          mimeType: payload.mimeType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.message || "ما قدرناش نتحقّقو من التصويرة. عاود! ");
      }
      if (data.pass) {
        const ok = completeMission(openMission.id, openMission.points);
        if (ok) sounds.success();
        setHint(data.message || "المهمّة نجحت!");
        setTimeout(closeModal, 1200);
      } else {
        setHint(data.message || "موش نفس المهمّة بالضبط. جرّب تصويرة أوضح.");
        sounds.error();
      }
    } catch (err) {
      setHint(isOfflineFetchError(err) ? offlineFetchHint() : err.message || "صار مشكل. عاود جرّب!");
      sounds.error();
    } finally {
      setBusy(false);
    }
  };

  const openFor = (m) => {
    sounds.tap();
    setOpenMission(m);
    setPreviewUrl(null);
    setPayload(null);
    setHint("صوّر حاجة تبيّن إلي عملت المهمّة هذي.");
    setTimeout(() => fileRef.current?.click(), 50);
  };

  return (
    <div className="scout-page">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPickFile}
      />

      <button
        type="button"
        onClick={() => {
          sounds.tap();
          closeModal();
          onBack();
        }}
        className="scout-wood-btn mb-4"
      >
        ← الرئيسية
      </button>

      <div className="scout-panel">
        <h2 className="scout-title">دفتر المهمّات</h2>
        <p className="scout-subtitle">
          أعمل المهمّة في الطبيعة، وبعدها هات <strong>تصويرة</strong> كدليل. صديق الكشّاف يشيّك قبل ما تاخذ
          النقاط.
        </p>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {missions.map((m) => {
            const done = completed.has(m.id);
            return (
              <li
                key={m.id}
                className={`scout-log-card flex flex-col ${
                  done
                    ? "ring-2 ring-emerald-300"
                    : "ring-1 ring-[#7f624466]"
                }`}
              >
                <span className="text-4xl" aria-hidden>
                  {m.emoji}
                </span>
                <span className="mt-2 text-lg font-black text-[#2c2418]">{m.title}</span>
                <span className="mt-1 text-sm font-extrabold text-[#5f4d34]">+{m.points} نقطة</span>
                <button
                  type="button"
                  disabled={done}
                  onClick={() => openFor(m)}
                  className={`mt-3 rounded-xl border py-3 text-lg font-black shadow transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
                    done
                      ? "border-emerald-700/40 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white"
                      : "border-[#79583a88] bg-gradient-to-b from-[#8e6748] to-[#6f4e37] text-[#fff0d4]"
                  }`}
                >
                  {done ? "✅ متأكد" : "📷 ثبّت بتصويرة"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {openMission && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mission-photo-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#d8c79f77] bg-[#f1e7cd] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 id="mission-photo-title" className="text-2xl font-black text-[#23412f]">
                  دليل بالتصويرة
                </h3>
                <p className="mt-1 font-bold text-[#5c4b33]">{openMission.emoji} {openMission.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.tap();
                  closeModal();
                }}
                className="rounded-full bg-[#d8ccb0] px-3 py-1 text-sm font-extrabold text-[#5a4730]"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 rounded-xl bg-[#ede2c5] p-3 text-sm font-semibold text-[#5e4c34]">{hint}</p>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-[#3f6f4d88] bg-[#f6f0de] py-4 text-lg font-black text-[#284734] active:scale-[0.99] disabled:opacity-60"
              >
                📸 إختر / صوّر تصويرة
              </button>

              {previewUrl && (
                <div className="overflow-hidden rounded-2xl border border-[#59714a77] bg-[#d8d2bf] shadow-inner">
                  <img
                    src={previewUrl}
                    alt="دليل المهمّة متاعك"
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              )}

              <button
                type="button"
                disabled={busy || !payload}
                onClick={sendPhoto}
                className="scout-badge-btn disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "قاعدين نشيّكو…" : "إبعث التصويرة لصديق الكشّاف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
