import { useCallback, useEffect, useRef, useState } from "react";
import { sounds } from "../utils/sounds.js";
import { isOfflineFetchError, offlineFetchHint } from "../utils/networkError.js";

/** Tunisia Arabic (BCP-47). Browser maps this to its best Arabic speech model. */
const SPEECH_LANG = import.meta.env.VITE_SPEECH_LANG || "ar-TN";

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function pickArabicVoice(voices) {
  const arTN = voices.find((v) => v.lang?.toLowerCase().startsWith("ar-tn"));
  if (arTN) return arTN;
  const ar = voices.find((v) => v.lang?.toLowerCase().startsWith("ar"));
  return ar || null;
}

/** If text has Arabic letters, use Arabic read-aloud; otherwise English voice. */
function textLooksArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Voice → text (Web Speech API) → POST /api/ask-ai → show reply + optional TTS.
 */
export default function VoiceAssistant({ onBack }) {
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const recRef = useRef(null);
  const transcriptRef = useRef("");

  const supported = Boolean(getRecognitionCtor());

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop?.();
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  /** Some browsers only fill `getVoices()` after this event (needed for Arabic TTS). */
  useEffect(() => {
    const prime = () => window.speechSynthesis.getVoices();
    prime();
    window.speechSynthesis.addEventListener("voiceschanged", prime);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", prime);
  }, []);

  const speak = useCallback(() => {
    if (!reply) return;
    sounds.tap();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(reply);
    const voices = window.speechSynthesis.getVoices();
    const useAr = textLooksArabic(reply);
    u.lang = useAr ? SPEECH_LANG : "en-US";
    u.rate = useAr ? 0.92 : 0.95;
    u.pitch = useAr ? 1.02 : 1.05;
    if (useAr) {
      const arVoice = pickArabicVoice(voices);
      if (arVoice) u.voice = arVoice;
    } else {
      const en =
        voices.find((v) => v.lang?.startsWith("en") && v.name.toLowerCase().includes("female")) ||
        voices.find((v) => v.lang?.startsWith("en"));
      if (en) u.voice = en;
    }
    window.speechSynthesis.speak(u);
  }, [reply]);

  const askAI = useCallback(async (text) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "المساعد مرتاح شوية. عاود بعد لحظة!");
      }
      setReply(data.reply || "ما فهمتش برشا — جرّب تسأل حاجة أخرى عن الطبيعة!");
      setStatus("done");
      sounds.success();
    } catch (e) {
      setErrorMsg(isOfflineFetchError(e) ? offlineFetchHint() : e.message || "صار مشكل. عاود جرّب!");
      setStatus("error");
      sounds.error();
    }
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setErrorMsg("المتصفّح هذا ما يدعمش التسجيل الصوتي. جرّب Chrome ولا Edge.");
      setStatus("error");
      sounds.error();
      return;
    }
    setTranscript("");
    transcriptRef.current = "";
    setReply("");
    setErrorMsg("");
    setStatus("listening");
    sounds.tap();

    const rec = new Ctor();
    rec.lang = SPEECH_LANG;
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (ev) => {
      let text = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0].transcript;
      }
      const trimmed = text.trim();
      transcriptRef.current = trimmed;
      setTranscript(trimmed);
    };

    rec.onerror = (ev) => {
      if (ev.error === "aborted" || ev.error === "no-speech") return;
      setErrorMsg("صار مشكل صغير في الميكرو. عاود إضغط وجرّب.");
      setStatus("error");
      sounds.error();
    };

    rec.onend = () => {
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        askAI(finalText);
      } else {
        setErrorMsg("ما سمعناش كلام واضح. قرّب وعاود إحكي بصوت أعلى شوية.");
        setStatus("error");
        sounds.error();
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setErrorMsg("ما نجمناش نشغّلو الميكرو. شيّك الصلاحيات وعاود.");
      setStatus("error");
      sounds.error();
    }
  }, [askAI]);

  const handleMainButton = () => {
    if (status === "listening") {
      stopListening();
      return;
    }
    startListening();
  };

  return (
    <div className="scout-page">
      <button
        type="button"
        onClick={() => {
          sounds.tap();
          stopListening();
          window.speechSynthesis.cancel();
          onBack();
        }}
        className="scout-wood-btn mb-4"
      >
        ← الرئيسية
      </button>

      <div className="scout-panel">
        <h2 className="scout-title">مركز التواصل الصوتي</h2>
        <p className="scout-subtitle">
          إحكي بالدارجة على الطبيعة، وكي تكمّل إضغط مرّة أخرى باش يوقف.
        </p>

        {!supported && (
          <p className="mt-4 rounded-xl border border-amber-300/70 bg-amber-100 p-3 text-center font-bold text-amber-900">
            التسجيل الصوتي يحتاج Chrome ولا Edge. تنجم زادة تلعب المهمّات والنقاط عادي.
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-6">
          <button
            type="button"
            onClick={handleMainButton}
            disabled={status === "loading"}
            className={`flex h-40 w-40 flex-col items-center justify-center rounded-full border text-center transition active:translate-y-1 disabled:opacity-60 ${
              status === "listening"
                ? "animate-pulse border-[#dcb97f88] bg-gradient-to-br from-[#7f5e3f] via-[#6f4f37] to-[#5a3f2d] text-[#fff1d4] shadow-[0_0_24px_rgba(244,209,124,0.36)]"
                : "border-[#7eb19388] bg-gradient-to-br from-[#2f664a] to-[#214b36] text-[#e8f8ee] shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
            }`}
            aria-pressed={status === "listening"}
          >
            <span className="text-5xl" aria-hidden>
              {status === "listening" ? "⏹" : "🎙️"}
            </span>
            <span className="mt-1 px-2 text-lg font-black drop-shadow">
              {status === "listening" ? "إضغط باش توقّف" : "إضغط باش تحكي"}
            </span>
          </button>

          {status === "loading" && (
            <p className="rounded-xl bg-[#ded3b5] px-4 py-2 text-center text-lg font-black text-[#3b5a44]">
              نخمّمو… ✨
            </p>
          )}

          {transcript && (
            <div className="scout-log-card w-full">
              <p className="text-xs font-black text-[#4d6248]">🎒 إنت قلت</p>
              <p className="text-lg font-bold text-[#2e251a]">{transcript}</p>
            </div>
          )}

          {reply && (
            <div className="scout-report w-full">
              <p className="text-xs font-black text-[#d5f0db]">🧭 تقرير صديق الكشّاف</p>
              <p className="text-lg font-bold text-[#eefaf2]">{reply}</p>
              <button
                type="button"
                onClick={speak}
                className="mt-3 w-full rounded-xl border border-[#9ee0b3aa] bg-[#2f694a] py-3 text-lg font-black text-[#ecfdf1] shadow active:scale-[0.99]"
              >
                🔊 إقراهالي بصوت
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="w-full rounded-2xl border border-rose-300/60 bg-rose-100/90 p-4 text-center text-base font-bold text-rose-900">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
