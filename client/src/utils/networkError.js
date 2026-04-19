/** Browser "Failed to fetch" when the API is down or unreachable. */
export function isOfflineFetchError(err) {
  if (!err) return false;
  if (err instanceof TypeError) return true;
  const m = String(err.message || "");
  return /failed to fetch|networkerror|load failed|network request failed/i.test(m);
}

export function offlineFetchHint() {
  return "ما نجمنّاش نوصلو لسيرفر الكشّاف. افتح تيرمينال في ai-scout-adventure وشغّل npm run dev، واستنّى حتى يخدمو الموقع والسيرفر مع بعضهم، وبعد إفتح http://localhost:5173 . إذا شغّلت الكلاينت وحدو، لازمك تشغّل السيرفر زادة (3001).";
}
