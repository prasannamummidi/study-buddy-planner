import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import {
  defaultSettings,
  storageKeys,
  useLocalState,
  type Settings,
  type Subject,
  type Task,
} from "@/lib/storage";
import { generateSchedule } from "@/lib/planner";

interface PlannerCtx {
  subjects: Subject[];
  tasks: Task[];
  settings: Settings;
  setSubjects: (s: Subject[]) => void;
  setTasks: (t: Task[]) => void;
  setSettings: (s: Settings) => void;
  regenerate: () => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  hydrated: boolean;
}

const Ctx = createContext<PlannerCtx | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects, h1] = useLocalState<Subject[]>(storageKeys.subjects, []);
  const [tasks, setTasks, h2] = useLocalState<Task[]>(storageKeys.tasks, []);
  const [settings, setSettings, h3] = useLocalState<Settings>(storageKeys.settings, defaultSettings);
  const hydrated = h1 && h2 && h3;

  // Apply dark mode
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode, hydrated]);

  // Browser notifications for upcoming tasks
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const interval = setInterval(() => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      tasks.forEach((t) => {
        if (t.completed || t.date !== today) return;
        const diff = t.startMinutes - nowMin;
        if (diff === 5) {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Study reminder", { body: `${t.topic} starts in 5 min` });
          }
          toast(`Upcoming: ${t.topic} in 5 min`);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, hydrated]);

  const value = useMemo<PlannerCtx>(
    () => ({
      subjects,
      tasks,
      settings,
      setSubjects,
      setTasks,
      setSettings,
      hydrated,
      regenerate: () => {
        const next = generateSchedule(subjects, settings, tasks);
        setTasks(next);
        toast.success("Schedule generated");
      },
      toggleTask: (id) =>
        setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))),
      updateTask: (id, patch) =>
        setTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTask: (id) => setTasks(tasks.filter((t) => t.id !== id)),
    }),
    [subjects, tasks, settings, hydrated, setSubjects, setTasks, setSettings],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlanner() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}
