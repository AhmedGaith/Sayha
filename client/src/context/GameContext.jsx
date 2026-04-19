import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LS, readJSON, readNumber, writeJSON, writeNumber } from "../utils/storage.js";
import { MISSIONS, levelFromPoints } from "../utils/missions.js";

const GameContext = createContext(null);

/** Mock friends for leaderboard demo — merged with local saves */
const MOCK_LEADERBOARD = [
  { id: "m1", name: "أحمد", score: 120 },
  { id: "m2", name: "فاطمة", score: 95 },
  { id: "m3", name: "محمد", score: 80 },
  { id: "m4", name: "سارة", score: 55 },
];

function loadInitial() {
  return {
    points: readNumber(LS.POINTS, 0),
    completed: new Set(readJSON(LS.MISSIONS, [])),
    scoutName: localStorage.getItem(LS.SCOUT_NAME) || "",
    customBoard: readJSON(LS.CUSTOM_LEADERBOARD, []),
  };
}

export function GameProvider({ children }) {
  const [points, setPoints] = useState(() => loadInitial().points);
  const [completed, setCompleted] = useState(() => loadInitial().completed);
  const [scoutName, setScoutNameState] = useState(() => loadInitial().scoutName);
  const [customBoard, setCustomBoard] = useState(() => loadInitial().customBoard);

  const setScoutName = useCallback((name) => {
    const trimmed = String(name || "").trim().slice(0, 24);
    setScoutNameState(trimmed);
    if (trimmed) localStorage.setItem(LS.SCOUT_NAME, trimmed);
    else localStorage.removeItem(LS.SCOUT_NAME);

    // Keep leaderboard in sync even if the player only changed their name.
    setCustomBoard((board) => {
      const displayName = trimmed || "إنت";
      const idx = board.findIndex((e) => e.self);
      let next;
      if (idx >= 0) {
        next = [...board];
        next[idx] = { ...next[idx], name: displayName, score: points, self: true };
      } else {
        next = [...board, { id: "self", name: displayName, score: points, self: true }];
      }
      writeJSON(LS.CUSTOM_LEADERBOARD, next);
      return next;
    });
  }, [points]);

  const addPoints = useCallback((n) => {
    setPoints((p) => {
      const next = p + n;
      writeNumber(LS.POINTS, next);
      return next;
    });
  }, []);

  const completeMission = useCallback(
    (missionId, missionPoints) => {
      if (completed.has(missionId)) return false;
      const newTotal = points + missionPoints;
      setCompleted((prev) => {
        const next = new Set(prev);
        next.add(missionId);
        writeJSON(LS.MISSIONS, [...next]);
        return next;
      });
      addPoints(missionPoints);
      setCustomBoard((board) => {
        const name = scoutName || "إنت";
        const idx = board.findIndex((e) => e.self);
        let next;
        if (idx >= 0) {
          next = [...board];
          next[idx] = { ...next[idx], name, score: newTotal, self: true };
        } else {
          next = [...board, { id: "self", name, score: newTotal, self: true }];
        }
        writeJSON(LS.CUSTOM_LEADERBOARD, next);
        return next;
      });
      return true;
    },
    [addPoints, completed, points, scoutName]
  );

  const level = useMemo(() => levelFromPoints(points), [points]);

  const leaderboard = useMemo(() => {
    const merged = [
      ...MOCK_LEADERBOARD.map((m) => ({ ...m, self: false })),
      ...customBoard.map((e) => ({ ...e, self: Boolean(e.self) })),
    ];
    merged.sort((a, b) => b.score - a.score);
    return merged.slice(0, 12);
  }, [customBoard]);

  const value = useMemo(
    () => ({
      points,
      level,
      completed,
      scoutName,
      setScoutName,
      addPoints,
      completeMission,
      missions: MISSIONS,
      leaderboard,
    }),
    [points, level, completed, scoutName, setScoutName, addPoints, completeMission, leaderboard]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
