import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePlanner } from "@/lib/planner-context";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { tasks, subjects, hydrated } = usePlanner();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const startDay = first.getDay();
    const lastDate = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startDay; i++) cells.push({ date: null, day: null });
    for (let d = 1; d <= lastDate; d++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), d);
      cells.push({ date: dt.toISOString().slice(0, 10), day: d });
    }
    return cells;
  }, [cursor]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks.forEach((t) => {
      (map[t.date] ||= []).push(t);
    });
    return map;
  }, [tasks]);

  const selectedTasks = (tasksByDate[selected] || []).slice().sort((a, b) => a.startMinutes - b.startMinutes);
  const today = new Date().toISOString().slice(0, 10);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Browse your full study schedule.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-2xl border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              {cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, i) => {
              if (!cell.date) return <div key={i} />;
              const dayTasks = tasksByDate[cell.date] || [];
              const done = dayTasks.filter((t) => t.completed).length;
              const isSelected = selected === cell.date;
              const isToday = cell.date === today;

              return (
                <button
                  key={i}
                  onClick={() => setSelected(cell.date!)}
                  className={cn(
                    "aspect-square rounded-lg p-1.5 text-left flex flex-col transition-colors relative",
                    "hover:bg-muted",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    !isSelected && isToday && "ring-1 ring-primary",
                  )}
                >
                  <span className={cn("text-sm font-medium", isToday && !isSelected && "text-primary")}>{cell.day}</span>
                  {dayTasks.length > 0 && (
                    <div className="mt-auto flex gap-0.5 flex-wrap">
                      {dayTasks.slice(0, 3).map((t) => {
                        const sub = subjectMap[t.subjectId];
                        return (
                          <span
                            key={t.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: sub?.color ?? "var(--primary)", opacity: t.completed ? 0.4 : 1 }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {dayTasks.length > 0 && (
                    <span className={cn("absolute top-1 right-1 text-[10px]", isSelected ? "opacity-80" : "text-muted-foreground")}>
                      {done}/{dayTasks.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3">
            {new Date(selected + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h2>
          {selectedTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No tasks scheduled.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => (
                <TaskCard key={t.id} task={t} subject={subjectMap[t.subjectId]} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
