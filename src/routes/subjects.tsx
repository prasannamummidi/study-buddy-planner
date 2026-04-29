import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { usePlanner } from "@/lib/planner-context";
import { SUBJECT_COLORS, uid, type Priority, type Subject } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subjects")({
  component: SubjectsPage,
});

function SubjectsPage() {
  const { subjects, setSubjects, regenerate, hydrated } = usePlanner();
  const [open, setOpen] = useState(false);

  if (!hydrated) return null;

  const remove = (id: string) => setSubjects(subjects.filter((s) => s.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground mt-1">Manage what you're studying.</p>
        </div>
        <div className="flex gap-2">
          {subjects.length > 0 && (
            <Button variant="outline" onClick={regenerate}>
              <Sparkles className="w-4 h-4" /> Regenerate
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4" /> Add subject</Button>
            </DialogTrigger>
            <SubjectDialog onSave={(s) => { setSubjects([...subjects, s]); setOpen(false); }} />
          </Dialog>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No subjects yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} onDelete={() => remove(s.id)} onUpdate={(u) => setSubjects(subjects.map((x) => x.id === s.id ? u : x))} />
          ))}
        </div>
      )}
    </div>
  );
}

const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };
const PRIORITY_TOKEN: Record<Priority, string> = {
  high: "bg-priority-high/20 text-priority-high",
  medium: "bg-priority-medium/20 text-priority-medium",
  low: "bg-priority-low/20 text-priority-low",
};

function SubjectCard({ subject, onDelete, onUpdate }: { subject: Subject; onDelete: () => void; onUpdate: (s: Subject) => void }) {
  const [open, setOpen] = useState(false);
  const daysLeft = subject.examDate
    ? Math.ceil((new Date(subject.examDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="rounded-2xl border bg-card p-5 hover:shadow-[var(--shadow-soft)] transition-all" style={{ borderTopColor: subject.color, borderTopWidth: 4 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-lg truncate">{subject.name}</h3>
          {subject.examDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Exam in {daysLeft} days · {new Date(subject.examDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", PRIORITY_TOKEN[subject.priority])}>
          {PRIORITY_LABEL[subject.priority]}
        </span>
      </div>

      {subject.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {subject.topics.slice(0, 5).map((t, i) => (
            <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-md">{t}</span>
          ))}
          {subject.topics.length > 5 && <span className="text-xs text-muted-foreground">+{subject.topics.length - 5}</span>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Weakness: {subject.weakness ?? 5}/10</div>
        <div className="flex gap-1">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="ghost">Edit</Button></DialogTrigger>
            <SubjectDialog initial={subject} onSave={(s) => { onUpdate(s); setOpen(false); }} />
          </Dialog>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SubjectDialog({ initial, onSave }: { initial?: Subject; onSave: (s: Subject) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [topicsRaw, setTopicsRaw] = useState(initial?.topics.join(", ") ?? "");
  const [examDate, setExamDate] = useState(initial?.examDate ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [color, setColor] = useState(initial?.color ?? SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)]);
  const [weakness, setWeakness] = useState<number>(initial?.weakness ?? 5);

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      topics: topicsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      examDate,
      priority,
      color,
      weakness,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{initial ? "Edit subject" : "New subject"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Subject name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" className="mt-1.5" />
        </div>
        <div>
          <Label>Topics (comma-separated)</Label>
          <Input value={topicsRaw} onChange={(e) => setTopicsRaw(e.target.value)} placeholder="Calculus, Algebra, Geometry" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Exam date</Label>
            <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Weakness self-rating: {weakness}/10</Label>
          <Slider value={[weakness]} onValueChange={(v) => setWeakness(v[0])} min={0} max={10} step={1} className="mt-3" />
          <p className="text-xs text-muted-foreground mt-1">Higher = more time will be allocated.</p>
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn("w-8 h-8 rounded-full border-2", color === c ? "border-foreground" : "border-transparent")}
                style={{ background: c }}
                aria-label="color"
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit}>{initial ? "Save changes" : "Create subject"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
