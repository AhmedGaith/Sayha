import { sounds } from "../utils/sounds.js";

/**
 * Main hub — big tiles for the three main areas + optional leaderboard.
 */
export default function Home({ onNavigate }) {
  const go = (screen) => {
    sounds.tap();
    onNavigate(screen);
  };

  return (
    <div className="scout-page">
      <header className="scout-panel">
        <p className="text-center text-xs font-black tracking-[0.22em] text-[#6a553a]">OUTDOOR SCOUT LOG</p>
        <h1 className="mt-1 text-center text-4xl font-black text-[#203624] md:text-5xl">كشّاف الذكاء الاصطناعي</h1>
        <p className="mt-2 text-center text-base font-bold text-[#594832]">
          لوحة مغامرة ذكية: مهمّات، خطط، وتقارير آمنة في الطبيعة.
        </p>
      </header>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => go("ask")}
          className="scout-tile scout-tile-ask"
        >
          <span className="text-5xl" aria-hidden>
            🎤
          </span>
          <div className="text-right">
            <span className="block text-2xl font-black">اسأل الذكاء</span>
            <span className="text-sm font-bold text-[#d7efdfcc]">تواصل صوتي مع مساعد الكشّاف</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => go("missions")}
          className="scout-tile scout-tile-mission"
        >
          <span className="text-5xl" aria-hidden>
            🧭
          </span>
          <div className="text-right">
            <span className="block text-2xl font-black">إبدأ مهمّة</span>
            <span className="text-sm font-bold text-[#ecf7d4d0]">تقارير مهمّات + إثبات بالصور</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => go("identify")}
          className="scout-tile scout-tile-identify"
        >
          <span className="text-5xl" aria-hidden>
            🔎
          </span>
          <div className="text-right">
            <span className="block text-2xl font-black">ماسح السلامة</span>
            <span className="text-sm font-bold text-[#e5f0d9d0]">تحليل نباتات وفطر وماكولات</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => go("camping")}
          className="scout-tile scout-tile-camping"
        >
          <span className="text-5xl" aria-hidden>
            ⛺
          </span>
          <div className="text-right">
            <span className="block text-2xl font-black">مخطّط التخييم</span>
            <span className="text-sm font-bold text-[#daf2e3cc]">لوغبوك تجهيز قبل الرحلة</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => go("score")}
          className="scout-tile scout-tile-score"
        >
          <span className="text-5xl" aria-hidden>
            ⭐
          </span>
          <div className="text-right">
            <span className="block text-2xl font-black">نقاطي</span>
            <span className="text-sm font-bold text-[#f4e7cbcf]">تقدّمك الكشفي والمستوى</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => go("leaderboard")}
          className="scout-wood-btn mt-1 w-full"
        >
          🏆 تقرير الترتيب
        </button>
      </div>
    </div>
  );
}
