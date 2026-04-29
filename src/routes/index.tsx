import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BookOpen, Sparkles, TrendingUp, Calendar as CalIcon } from "lucide-react";
import { usePlanner } from "@/lib/planner-context";
import { aiSuggestions, todayISO, weeklySummary } from "@/lib/planner";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { subjects, tasks, regenerate, hydrated } = usePlanner();

  const today = todayISO();
  const todays = useMemo(
    () => tasks.filter((t) => t.date === today).sort((a, b) => a.startMinutes - b.startMinutes),
    [tasks, today],
  );
  const completedToday = todays.filter((t) => t.completed).length;
  const summary = useMemo(() => weeklySummary(tasks), [tasks]);
  const tips = useMemo(() => aiSuggestions(subjects, tasks), [subjects, tasks]);
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  if (!hydrated) return null;

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-primary-foreground"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to StudyFlow</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Add your subjects and exam dates to get a smart, balanced study plan tailored to your schedule.
        </p>
        <Link to="/subjects" className="mt-6">
          <Button size="lg">Add your first subject</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1">Today's Plan</h1>
        </div>
        <Button onClick={regenerate} variant="outline">
          <Sparkles className="w-4 h-4" />
          Regenerate plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Today" value={`${completedToday}/${todays.length}`} sub="tasks completed" icon={<CalIcon className="w-4 h-4" />} progress={todays.length ? (completedToday / todays.length) * 100 : 0} />
        <StatCard label="This week" value={`${summary.completionRate}%`} sub={`${summary.completed} of ${summary.total} done`} icon={<TrendingUp className="w-4 h-4" />} progress={summary.completionRate} />
        <StatCard label="Hours studied" value={`${(summary.minutesStudied / 60).toFixed(1)}h`} sub="last 7 days" icon={<BookOpen className="w-4 h-4" />} />
      </div>

      {/* AI tips */}
      {tips.length > 0 && (
        <div className="rounded-2xl p-5 border" style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}>
          <div className="flex items-center gap-2 font-semibold mb-3">
            <Sparkles className="w-4 h-4" /> Smart suggestions
          </div>
          <ul className="space-y-2 text-sm">
            {tips.map((t, i) => (
              <li key={i} className="opacity-95">{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Today's tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Schedule</h2>
        {todays.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No tasks for today.</p>
            <Button onClick={regenerate} variant="link" className="mt-2">Generate schedule</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {todays.map((t) => (
              <TaskCard key={t.id} task={t} subject={subjectMap[t.subjectId]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, progress }: { label: string; value: string; sub: string; icon: React.ReactNode; progress?: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
      {progress !== undefined && <Progress value={progress} className="mt-3 h-1.5" />}
    </div>
  );
}
