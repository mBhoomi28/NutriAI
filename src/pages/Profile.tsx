import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Profile {
  name: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_lb: number | null;
  goal: string | null;
  daily_calorie_goal: number | null;
}

const Profile = () => {
  const { user } = useAuth();
  const [p, setP] = useState<Profile>({
    name: "", age: null, gender: "", height_cm: null, weight_lb: null, goal: "maintain", daily_calorie_goal: 2200,
  });
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) setP(data as any);

      const today = new Date(); today.setHours(0,0,0,0);
      const { data: meals } = await supabase
        .from("meals").select("calories, logged_at").eq("user_id", user.id);
      if (meals) {
        const todaySum = meals.filter(m => new Date(m.logged_at) >= today).reduce((s,m)=>s+m.calories,0);
        const totalSum = meals.reduce((s,m)=>s+m.calories,0);
        setStats({ today: todaySum, total: totalSum });
      }
    })();
  }, [user]);

  const bmi = p.height_cm && p.weight_lb
    ? ((Number(p.weight_lb) * 0.453592) / Math.pow(Number(p.height_cm)/100, 2)).toFixed(1)
    : "—";

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...p });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  return (
    <AppShell title="User Profile">
      <div className="nutri-card space-y-3">
        {[
          { k: "name", label: "Name", type: "text" },
          { k: "age", label: "Age", type: "number" },
          { k: "gender", label: "Gender", type: "text" },
          { k: "height_cm", label: "Height (cm)", type: "number" },
          { k: "weight_lb", label: "Weight (lb)", type: "number" },
          { k: "daily_calorie_goal", label: "Daily Calorie Goal", type: "number" },
        ].map(({ k, label, type }) => (
          <div key={k} className="flex items-center gap-3">
            <label className="font-display font-semibold text-foreground w-40 text-sm">{label}:</label>
            <input
              type={type}
              value={(p as any)[k] ?? ""}
              onChange={(e) => setP({ ...p, [k]: type === "number" ? Number(e.target.value) || null : e.target.value })}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm bg-white"
            />
          </div>
        ))}
        <div className="flex items-center gap-3">
          <label className="font-display font-semibold text-foreground w-40 text-sm">Goal:</label>
          <select
            value={p.goal ?? "maintain"}
            onChange={(e) => setP({ ...p, goal: e.target.value })}
            className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm bg-white"
          >
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain">Gain weight</option>
          </select>
        </div>

        <div className="pt-2 border-t border-border space-y-1 text-sm">
          <p className="font-display"><b>BMI:</b> {bmi}</p>
          <p className="font-display"><b>Calories consumed today:</b> {stats.today}</p>
          <p className="font-display"><b>Calories consumed total:</b> {stats.total}</p>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="w-full mt-3 rounded-xl bg-teal-deep text-white font-semibold py-2.5 hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </AppShell>
  );
};

export default Profile;
