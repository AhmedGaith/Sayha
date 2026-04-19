/** localStorage keys for the scout app */
export const LS = {
  POINTS: "aiScout_points",
  MISSIONS: "aiScout_completedMissionIds",
  SCOUT_NAME: "aiScout_scoutName",
  CUSTOM_LEADERBOARD: "aiScout_leaderboardEntries",
};

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readNumber(key, fallback = 0) {
  const n = Number(localStorage.getItem(key));
  return Number.isFinite(n) ? n : fallback;
}

export function writeNumber(key, value) {
  localStorage.setItem(key, String(Math.max(0, Math.floor(value))));
}
