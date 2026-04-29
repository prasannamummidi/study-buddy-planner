import type { Settings, Subject, Task } from "./storage";
import { uid } from "./storage";

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 } as const;

export function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function fmtTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")} ${ap}`;
}

export function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Generate a balanced study schedule.
 * - Distributes minutes per day across subjects weighted by priority + urgency.
 * - Inserts revision-only sessions in the final 3 days before each exam.
 * - Adds breaks between sessions.
 * - Preserves completed tasks (won't overwrite history).
 */
export function generateSchedule(
  subjects: Subject[],
  settings: Settings,
  existing: Task[],
  horizonDays = 21,
): Task[] {
  const start = todayISO();
  const completed = existing.filter((t) => t.completed || t.date < start);
  const result: Task[] = [...completed];

  if (subjects.length === 0) return result;

  for (let i = 0; i < horizonDays; i++) {
    const date = addDays(start, i);

    // Eligible subjects: exam not yet passed
    const eligible = subjects.filter((s) => !s.examDate || s.examDate >= date);
    if (eligible.length === 0) continue;

    // Score each subject: weight = priority * urgency
    const scored = eligible.map((s) => {
      const daysLeft = s.examDate ? Math.max(1, daysBetween(date, s.examDate) + 1) : 14;
      const urgency = 1 / daysLeft;
      const weakness = ((s.weakness ?? 5) / 5) * 0.5 + 0.75; // 0.75x - 1.75x
      return {
        subject: s,
        weight: PRIORITY_WEIGHT[s.priority] * urgency * weakness,
        daysLeft,
        isRevision: s.examDate ? daysBetween(date, s.examDate) <= 3 : false,
      };
    });

    const totalWeight = scored.reduce((sum, x) => sum + x.weight, 0);
    if (totalWeight === 0) continue;

    const totalMinutes = settings.hoursPerDay * 60;
    let cursor = settings.startHour * 60;

    // Allocate sessions proportionally
    const allocations = scored
      .map((x) => ({
        ...x,
        minutes: Math.round((x.weight / totalWeight) * totalMinutes),
      }))
      .filter((x) => x.minutes >= 15)
      .sort((a, b) => b.weight - a.weight);

    for (let idx = 0; idx < allocations.length; idx++) {
      const a = allocations[idx];
      let remaining = a.minutes;
      while (remaining >= 20) {
        const dur = Math.min(remaining, settings.sessionMinutes);
        const topic = a.isRevision
          ? `Revision: ${pickTopic(a.subject)}`
          : pickTopic(a.subject);

        // Skip if user already has a task at this slot for this date
        const slotTaken = result.some(
          (t) =>
            t.date === date &&
            t.startMinutes < cursor + dur &&
            t.startMinutes + t.durationMinutes > cursor,
        );
        if (!slotTaken) {
          result.push({
            id: uid(),
            subjectId: a.subject.id,
            topic,
            date,
            startMinutes: cursor,
            durationMinutes: dur,
            type: a.isRevision ? "revision" : "study",
            completed: false,
          });
        }
        cursor += dur;
        remaining -= dur;

        // Add a break between sessions (not after last)
        if (remaining >= 20 || idx < allocations.length - 1) {
          cursor += settings.breakMinutes;
        }
      }
    }
  }

  return result.sort((a, b) =>
    a.date === b.date ? a.startMinutes - b.startMinutes : a.date.localeCompare(b.date),
  );
}

function pickTopic(s: Subject): string {
  if (!s.topics || s.topics.length === 0) return s.name;
  return s.topics[Math.floor(Math.random() * s.topics.length)];
}

export function aiSuggestions(subjects: Subject[], tasks: Task[]): string[] {
  const tips: string[] = [];
  const today = todayISO();

  for (const s of subjects) {
    if (!s.examDate) continue;
    const daysLeft = daysBetween(today, s.examDate);
    if (daysLeft < 0) continue;

    const subjectTasks = tasks.filter((t) => t.subjectId === s.id);
    const completed = subjectTasks.filter((t) => t.completed).length;
    const total = subjectTasks.length || 1;
    const ratio = completed / total;

    if (daysLeft <= 7 && ratio < 0.5) {
      tips.push(`⚠️ ${s.name} exam in ${daysLeft} days — only ${Math.round(ratio * 100)}% done. Allocate more time today.`);
    }
    if ((s.weakness ?? 0) >= 7) {
      tips.push(`📚 You marked ${s.name} as a weak area. Add an extra revision slot this week.`);
    }
    if (s.priority === "high" && ratio < 0.3 && daysLeft <= 14) {
      tips.push(`🎯 ${s.name} is high-priority — focus your peak-energy hours here.`);
    }
  }

  if (tips.length === 0 && subjects.length > 0) {
    tips.push("✅ You're on track! Keep the momentum and take your scheduled breaks.");
  }
  return tips.slice(0, 4);
}

export function weeklySummary(tasks: Task[]) {
  const today = todayISO();
  const weekAgo = addDays(today, -6);
  const weekTasks = tasks.filter((t) => t.date >= weekAgo && t.date <= today);
  const completed = weekTasks.filter((t) => t.completed).length;
  const total = weekTasks.length;
  const minutesStudied = weekTasks
    .filter((t) => t.completed)
    .reduce((s, t) => s + t.durationMinutes, 0);
  return {
    completed,
    total,
    minutesStudied,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
}
