import { useEffect, useRef, useState } from "react";
import { compressImageToJpeg } from "../utils/compressImage.js";
import { sounds } from "../utils/sounds.js";
import { isOfflineFetchError, offlineFetchHint } from "../utils/networkError.js";
import { apiUrl } from "../utils/api.js";

function safetyClass(level) {
  if (level === "SAFE") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (level === "DANGEROUS") return "bg-rose-100 text-rose-900 border-rose-300";
  return "bg-amber-100 text-amber-900 border-amber-300";
}

function safetyLabel(level) {
  if (level === "SAFE") return "مأمون";
  if (level === "DANGEROUS") return "خطر";
  return "غير مؤكّد";
}

/** Upload a photo and ask AI to identify plant/mushroom/food with safety-first output. */
export default function VisualIdentifier({ onBack }) {
  const fileRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [payload, setPayload] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("حمّل تصويرة واضحة للحاجة.");
  const [result, setResult] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setHint("إختر ملف تصويرة صحيح (PNG ولا JPG).");
      return;
    }

    setHint("قاعدين نحضّرو التصويرة…");
    setResult(null);

    try {
      const { base64, mimeType } = await compressImageToJpeg(file);
      setPayload({ base64, mimeType });
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(file);
      });
      setHint("واجدة. إضغط على حلّل التصويرة.");
      sounds.tap();
    } catch {
      setHint("ما نجمنّاش نستعملو التصويرة هاذي. جرّب وحدة أخرى.");
      setPayload(null);
      setResult(null);
      sounds.error();
    }
  };

  const analyzePhoto = async () => {
    if (!payload) {
      setHint("إختر تصويرة قبل.");
      return;
    }

    setBusy(true);
    setHint("قاعدين نحلّلو الحاجة…");
    setResult(null);

    try {
      const res = await fetch(apiUrl("/api/identify-item"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: payload.base64,
          mimeType: payload.mimeType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "ما نجمنّاش نحلّلو التصويرة هاذي.");
      }

      setResult(data);
      setHint("التحليل واجد.");
      sounds.success();
    } catch (err) {
      setHint(isOfflineFetchError(err) ? offlineFetchHint() : err.message || "عاود جرّب.");
      sounds.error();
    } finally {
      setBusy(false);
    }
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
          onBack();
        }}
        className="scout-wood-btn mb-4"
      >
        ← الرئيسية
      </button>

      <div className="scout-panel">
        <h2 className="scout-title">ماسح الأمان الذكي</h2>
        <p className="scout-subtitle">
          عرّف نباتات، فطر، ولا ماكولات مع تشديد على السلامة.
        </p>

        <p className="mt-4 rounded-2xl border border-[#baa17166] bg-[#f0e4c7] p-3 text-sm font-semibold text-[#5d4a33]">
          {hint}
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-[#496b4d99] bg-[#f3ebd2] py-4 text-lg font-black text-[#2b4833] active:scale-[0.99] disabled:opacity-60"
          >
            🔭 إختر / صوّر تصويرة
          </button>

          {previewUrl && (
            <div className="overflow-hidden rounded-2xl border border-[#667d5a77] bg-[#d8d2bf] shadow-inner">
              <img src={previewUrl} alt="الحاجة إلي تصوّرت" className="max-h-64 w-full object-contain" />
            </div>
          )}

          <button
            type="button"
            disabled={busy || !payload}
            onClick={analyzePhoto}
            className="scout-badge-btn disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "قاعدين نحلّلو…" : "📡 حلّل التصويرة"}
          </button>
        </div>

        {result && (
          <div className="scout-report mt-5">
            <h3 className="text-lg font-black text-[#d9f5df]">تقرير AI Scout</h3>

            <div className="mt-3 space-y-2 text-sm font-semibold text-[#d8eadf]">
              <p>
                <span className="font-black text-[#f6edc8]">الإسم:</span> {result.name}
              </p>
              <p>
                <span className="font-black text-[#f6edc8]">الوصف:</span> {result.description}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-black text-[#f6edc8]">مستوى السلامة:</span>
                <span className={`rounded-full border px-2 py-1 text-xs font-extrabold ${safetyClass(result.safetyLevel)}`}>
                  {safetyLabel(result.safetyLevel)}
                </span>
              </p>
              <p>
                <span className="font-black text-[#f6edc8]">تنبيه:</span> {result.warning}
              </p>
              <p>
                <span className="font-black text-[#f6edc8]">نسبة الثقة:</span> {result.confidence}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
