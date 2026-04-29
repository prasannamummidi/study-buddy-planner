import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Trash2 } from "lucide-react";
import { usePlanner } from "@/lib/planner-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, setSettings, regenerate, setSubjects, setTasks, hydrated } = usePlanner();

  if (!hydrated) return null;

  const reset = () => {
    if (!confirm("Delete all subjects and tasks? This cannot be undone.")) return;
    setSubjects([]);
    setTasks([]);
    toast.success("All data cleared");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your study preferences.</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Dark mode</Label>
            <p className="text-sm text-muted-foreground">Easier on the eyes for late-night studying.</p>
          </div>
          <Switch checked={settings.darkMode} onCheckedChange={(v) => setSettings({ ...settings, darkMode: v })} />
        </div>

        <div>
          <Label>Available study hours per day: {settings.hoursPerDay}h</Label>
          <Slider
            value={[settings.hoursPerDay]}
            onValueChange={(v) => setSettings({ ...settings, hoursPerDay: v[0] })}
            min={1}
            max={12}
            step={0.5}
            className="mt-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start time (hour)</Label>
            <Input
              type="number"
              min={0}
              max={23}
              value={settings.startHour}
              onChange={(e) => setSettings({ ...settings, startHour: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Session length (min)</Label>
            <Input
              type="number"
              min={15}
              max={120}
              value={settings.sessionMinutes}
              onChange={(e) => setSettings({ ...settings, sessionMinutes: Number(e.target.value) })}
              className="mt-1.5"
            />
          </div>
        </div>

        <div>
          <Label>Break between sessions: {settings.breakMinutes} min</Label>
          <Slider
            value={[settings.breakMinutes]}
            onValueChange={(v) => setSettings({ ...settings, breakMinutes: v[0] })}
            min={0}
            max={30}
            step={5}
            className="mt-3"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={regenerate} className="flex-1">
          <Sparkles className="w-4 h-4" /> Regenerate schedule with new settings
        </Button>
        <Button variant="destructive" onClick={reset}>
          <Trash2 className="w-4 h-4" /> Reset all data
        </Button>
      </div>
    </div>
  );
}
