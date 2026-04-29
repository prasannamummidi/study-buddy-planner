import { useState } from "react";
import { Check, Clock, Pencil, Trash2 } from "lucide-react";
import type { Subject, Task } from "@/lib/storage";
import { fmtTime } from "@/lib/planner";
import { usePlanner } from "@/lib/planner-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  task: Task;
  subject?: Subject;
  compact?: boolean;
}

export function TaskCard({ task, subject, compact }: Props) {
  const { toggleTask, updateTask, deleteTask } = usePlanner();
  const [editing, setEditing] = useState(false);
  const [topic, setTopic] = useState(task.topic);
  const [date, setDate] = useState(task.date);
  const [start, setStart] = useState(
    `${Math.floor(task.startMinutes / 60).toString().padStart(2, "0")}:${(task.startMinutes % 60).toString().padStart(2, "0")}`,
  );

  const save = () => {
    const [h, m] = start.split(":").map(Number);
    updateTask(task.id, { topic, date, startMinutes: h * 60 + m });
    setEditing(false);
  };

  const isRevision = task.type === "revision";
  const color = subject?.color ?? "oklch(0.62 0.18 265)";

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all",
        "hover:shadow-[var(--shadow-soft)]",
        task.completed && "opacity-60",
      )}
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleTask(task.id)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
            task.completed
              ? "bg-success border-success text-success-foreground"
              : "border-muted-foreground/40 hover:border-primary",
          )}
          aria-label="Toggle complete"
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
              <div className="flex gap-2">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                {subject && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${color} / 0.15`, color }}
                  >
                    {subject.name}
                  </span>
                )}
                {isRevision && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning/20 text-warning-foreground">
                    Revision
                  </span>
                )}
              </div>
              <p className={cn("font-medium mt-1 text-sm", task.completed && "line-through")}>
                {task.topic}
              </p>
              {!compact && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <Clock className="w-3 h-3" />
                  {fmtTime(task.startMinutes)} · {task.durationMinutes} min
                </div>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTask(task.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
