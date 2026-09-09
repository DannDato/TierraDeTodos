import { useEffect, useState } from "react";
import { Award, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";

const rarityClasses = {
  COMMON: "border-slate-300/10 bg-slate-500/15 text-slate-200",
  UNCOMMON: "border-emerald-300/10 bg-emerald-500/15 text-emerald-200",
  RARE: "border-sky-300/10 bg-sky-500/15 text-sky-200",
  EPIC: "border-fuchsia-300/10 bg-fuchsia-500/15 text-fuchsia-200",
  LEGENDARY: "border-amber-300/10 bg-amber-500/15 text-amber-200",
  MYTHIC: "border-rose-300/10 bg-rose-500/15 text-rose-200",
};

function AchievementsPanel() {
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/user/progress/achievements")
      .then(({ data }) => setAchievements(data?.achievements || []))
      .catch((requestError) => setError(requestError.response?.data?.message || "No se pudieron cargar los achievements."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--ins-text-gray)]">Cargando achievements...</p>;
  if (error) return <p className="text-sm text-[var(--danger-color)]">{error}</p>;
  if (!achievements.length) return <p className="text-sm text-[var(--ins-text-gray)]">Todavía no hay achievements disponibles.</p>;

  return (
    <div className="grid w-full grid-cols-1 gap-3">
      {achievements.map((achievement) => {
        const goal = Math.max(Number(achievement.goal) || 1, 1);
        const progress = Math.min(Number(achievement.progress) || 0, goal);
        const percentage = achievement.isReached ? 100 : Math.round((progress / goal) * 100);
        return (
          <article key={achievement.key} className={`rounded-2xl border p-3 ${achievement.isReached ? "border-emerald-300/20 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
            <div className="flex items-center gap-3">
                {achievement.icon ? <img src={achievement.icon} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" /> : <Award size={22} className="shrink-0 text-[var(--secondary-color)]" />}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-[var(--ins-text-white)]">{achievement.name}</h3>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${rarityClasses[achievement.rarity] || rarityClasses.COMMON}`}>{achievement.rarity}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--ins-text-gray)]">{achievement.description}</p>
                </div>
                {achievement.isReached && <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />}
            </div>

            <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/20">
                    <div className="h-full rounded-full bg-[var(--secondary-color)] transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <span className="shrink-0 text-[11px] text-[var(--ins-text-gray)]">{progress} / {goal}</span>
                {!achievement.isReached && <span className="shrink-0 text-[11px] font-bold text-[var(--ins-text-gray)]">{percentage}%</span>}
            </div>

            {achievement.prizeEmblem && <p className="mt-2 truncate text-[11px] text-[var(--ins-text-gray)]">Premio: {achievement.prizeEmblem.name}</p>}
        </article>
        );
      })}
    </div>
  );
}

export default AchievementsPanel;
