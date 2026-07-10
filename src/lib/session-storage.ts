import type { LoggedExercise, Split } from "@/lib/types";

const KEY = "liftcipher:activeSession";

export interface SavedSession {
  split: Split;
  day: string;
  date: string;
  exIndex: number;
  setIndex: number;
  subIndex: 0 | 1;
  collected: LoggedExercise[];
  restEndAt: number | null;
}

export function loadSavedSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

export function saveSession(s: SavedSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function clearSavedSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
