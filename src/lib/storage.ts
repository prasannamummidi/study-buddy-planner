import { useEffect, useState } from "react";

export type Priority = "high" | "medium" | "low";

export interface Subject {
  id: string;
  name: string;
  topics: string[];
  examDate: string; // ISO date
  priority: Priority;
  color: string;
  weakness?: number; // 0-10, optional self-rated
}

export interface Task {
  id: string;
  subjectId: string;
  topic: string;
  date: string; // YYYY-MM-DD
  startMinutes: number; // minutes from 00:00
  durationMinutes: number;
  type: "study" | "revision" | "break";
  completed: boolean;
}

export interface Settings {
  hoursPerDay: number;
  startHour: number; // e.g. 9
  sessionMinutes: number; // e.g. 50
  breakMinutes: number; // e.g. 10
  darkMode: boolean;
}

const KEYS = {
  subjects: "ssp.subjects",
  tasks: "ssp.tasks",
  settings: "ssp.settings",
};

export const defaultSettings: Settings = {
  hoursPerDay: 4,
  startHour: 16,
  sessionMinutes: 50,
  breakMinutes: 10,
  darkMode: true,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function useLocalState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read(key, initial));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydrated) write(key, state);
  }, [key, state, hydrated]);

  return [state, setState, hydrated] as const;
}

export const storageKeys = KEYS;

export const SUBJECT_COLORS = [
  "oklch(0.7 0.17 25)",
  "oklch(0.72 0.16 70)",
  "oklch(0.7 0.17 145)",
  "oklch(0.7 0.15 200)",
  "oklch(0.7 0.18 265)",
  "oklch(0.7 0.2 320)",
  "oklch(0.75 0.14 100)",
  "oklch(0.7 0.17 350)",
];

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
