import { useEffect, useMemo, useState } from "react";
import { Award, BarChart3, CheckCircle2, GripVertical, LayoutGrid, RefreshCw, ShieldCheck } from "lucide-react";

import api from "../../api/axios";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import AchievementsPanel from "../../components/user/AchievementsPanel";

const sortByOrder = (items) => [...items].sort((left, right) => {
	const orderDiff = (Number(left?.order) || 0) - (Number(right?.order) || 0);
	if (orderDiff !== 0) return orderDiff;

	return String(left?.emblem?.name || "").localeCompare(String(right?.emblem?.name || ""), "es", {
		sensitivity: "base",
	});
});

const normalizePayload = (payload) => {
	const allRows = Array.isArray(payload?.userEmblems)
		? payload.userEmblems
		: Array.isArray(payload?.allEmblems) || Array.isArray(payload?.equippedEmblems)
			? [...(payload?.equippedEmblems || []), ...(payload?.allEmblems || [])]
			: [];

	const sortedRows = sortByOrder(allRows);

	return {
		available: sortedRows.filter((item) => !item.isEquipped),
		equipped: sortedRows.filter((item) => item.isEquipped),
	};
};

const badgeRarityClasses = {
	common: "bg-slate-500/15 text-slate-200 border-slate-300/10",
	rare: "bg-sky-500/15 text-sky-200 border-sky-300/10",
	epic: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-300/10",
	legendary: "bg-amber-500/15 text-amber-200 border-amber-300/10",
	mythic: "bg-rose-500/15 text-rose-200 border-rose-300/10",
};

function Progress() {
	const [availableEmblems, setAvailableEmblems] = useState([]);
	const [equippedEmblems, setEquippedEmblems] = useState([]);
	const [achievementSummary, setAchievementSummary] = useState({
		achievedAchievements: 0,
		totalAchievements: 0,
		achievementCompletion: 0,
		emblemsAchieved: 0,
	});
	const [stats, setStats] = useState({
		totalEmblems: 0,
		equippedEmblems: 0,
		unequippedEmblems: 0,
		totalGoals: 0,
		completedGoals: 0,
		inProgressGoals: 0,
		totalGoalProgress: 0,
		averageGoalCompletion: 0,
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [feedback, setFeedback] = useState("");
	const [dragState, setDragState] = useState(null);

	const totalCount = stats.totalEmblems || availableEmblems.length + equippedEmblems.length;

	const loadProgress = async () => {
		setLoading(true);
		setError("");

		try {
			const [{ data }, { data: statsData }] = await Promise.all([
				api.get("/user/progress/emblems"),
				api.get("/user/progress/stats"),
			]);
			const normalized = normalizePayload(data);
			setAvailableEmblems(normalized.available);
			setEquippedEmblems(normalized.equipped);
			setAchievementSummary({
				achievedAchievements: Number(statsData?.summary?.achievedAchievements) || 0,
				totalAchievements: Number(statsData?.summary?.totalAchievements) || 0,
				achievementCompletion: Number(statsData?.summary?.achievementCompletion) || 0,
				emblemsAchieved: Number(statsData?.summary?.emblemsAchieved) || 0,
			});
			setStats({
				totalEmblems: Number(data?.stats?.totalEmblems) || 0,
				equippedEmblems: Number(data?.stats?.equippedEmblems) || 0,
				unequippedEmblems: Number(data?.stats?.unequippedEmblems) || 0,
				totalGoals: Number(data?.stats?.totalGoals) || 0,
				completedGoals: Number(data?.stats?.completedGoals) || 0,
				inProgressGoals: Number(data?.stats?.inProgressGoals) || 0,
				totalGoalProgress: Number(data?.stats?.totalGoalProgress) || 0,
				averageGoalCompletion: Number(data?.stats?.averageGoalCompletion) || 0,
			});
		} catch (loadError) {
			setError(loadError?.response?.data?.message || "No se pudieron cargar tus insignias.");
			setAvailableEmblems([]);
			setEquippedEmblems([]);
			setAchievementSummary({
				achievedAchievements: 0,
				totalAchievements: 0,
				achievementCompletion: 0,
				emblemsAchieved: 0,
			});
			setStats({
				totalEmblems: 0,
				equippedEmblems: 0,
				unequippedEmblems: 0,
				totalGoals: 0,
				completedGoals: 0,
				inProgressGoals: 0,
				totalGoalProgress: 0,
				averageGoalCompletion: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProgress();
	}, []);

	const persistLayout = async (nextAvailable, nextEquipped) => {
		setSaving(true);
		setError("");
		setFeedback("");

		try {
			await api.put("/user/progress/emblems", {
				availableIds: nextAvailable.map((item) => item.id),
				equippedIds: nextEquipped.map((item) => item.id),
			});
			setFeedback("Organización de insignias guardada.");
		} catch (saveError) {
			setError(saveError?.response?.data?.message || "No se pudo guardar la organización de insignias.");
			await loadProgress();
		} finally {
			setSaving(false);
		}
	};

	const applyMove = (sourceColumn, sourceIndex, targetColumn, targetIndex) => {
		const sourceList = sourceColumn === "equipped" ? equippedEmblems : availableEmblems;
		const targetList = targetColumn === "equipped" ? equippedEmblems : availableEmblems;
		const movingItem = sourceList[sourceIndex];

		if (!movingItem) return;

		const nextSource = [...sourceList];
		nextSource.splice(sourceIndex, 1);

		const nextTarget = sourceColumn === targetColumn ? nextSource : [...targetList];
		const safeTargetIndex = Math.max(0, Math.min(targetIndex, nextTarget.length));
		nextTarget.splice(safeTargetIndex, 0, {
			...movingItem,
			isEquipped: targetColumn === "equipped",
			order: safeTargetIndex,
		});

		const nextAvailable = sourceColumn === "available" && targetColumn === "available"
			? nextTarget
			: sourceColumn === "available"
				? nextSource
				: targetColumn === "available"
					? nextTarget
					: availableEmblems;

		const nextEquipped = sourceColumn === "equipped" && targetColumn === "equipped"
			? nextTarget
			: sourceColumn === "equipped"
				? nextSource
				: targetColumn === "equipped"
					? nextTarget
					: equippedEmblems;

		const normalizedAvailable = nextAvailable.map((item, index) => ({ ...item, isEquipped: false, order: index }));
		const normalizedEquipped = nextEquipped.map((item, index) => ({ ...item, isEquipped: true, order: index }));

		setAvailableEmblems(normalizedAvailable);
		setEquippedEmblems(normalizedEquipped);
		void persistLayout(normalizedAvailable, normalizedEquipped);
	};

	const handleDropOnColumn = (targetColumn, targetIndex = null) => {
		if (!dragState) return;

		const sourceColumn = dragState.column;
		const sourceIndex = dragState.index;

		if (!Number.isInteger(sourceIndex)) return;

		const fallbackIndex = targetColumn === "equipped" ? equippedEmblems.length : availableEmblems.length;
		let resolvedTargetIndex = targetIndex ?? fallbackIndex;

		if (sourceColumn === targetColumn && sourceIndex < resolvedTargetIndex) {
			resolvedTargetIndex -= 1;
		}

		applyMove(sourceColumn, sourceIndex, targetColumn, resolvedTargetIndex);
		setDragState(null);
	};

	const summary = useMemo(() => {
		if (!totalCount) {
			return "Aun no tienes insignias registradas.";
		}

		return `${stats.equippedEmblems} equipadas de ${totalCount} insignias obtenidas.`;
	}, [stats.equippedEmblems, totalCount]);

	const statCards = useMemo(() => ([
		{
			key: "achieved-achievements",
			label: "Logros obtenidos",
			value: achievementSummary.achievedAchievements,
			helper: `${achievementSummary.totalAchievements} existentes`,
			icon: CheckCircle2,
			accentClassName: "text-emerald-300 bg-emerald-500/15",
		},
		{
			key: "achieved-emblems",
			label: "Emblemas obtenidos",
			value: achievementSummary.emblemsAchieved,
			helper: "Coleccionables de tu cuenta",
			icon: Award,
			accentClassName: "text-amber-300 bg-amber-500/15",
		},
		{
			key: "achievement-completion",
			label: "Progreso de logros",
			value: `${achievementSummary.achievementCompletion}%`,
			helper: "Logros obtenidos / existentes",
			icon: BarChart3,
			accentClassName: "text-sky-300 bg-sky-500/15",
		},
	]), [achievementSummary]);

	return (
		<div>
			<LoadingOverlay isVisible={loading} message="Cargando progreso" />

			<div className="py-15 flex flex-col items-center pb-24 text-[var(--white-color)] z-[1] p-3">
				<div className="w-full px-0 mx-0 text-[var(--ins-text-white)]">
					<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
						<div>
							<div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2">
								<span>{localStorage.getItem("role") || "Usuario"}</span>
								<span>/</span>
								<span className="text-[var(--secondary-color)]">Progreso</span>
							</div>
							<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Progreso</h1>
							<p className="hidden lg:block text-sm text-[var(--ins-text-white)] mt-2 max-w-2xl">
								Consulta tus estadísticas, organiza tus insignias y revisa el progreso de tus achievements.
							</p>
						</div>
						<div className="text-right text-sm text-[var(--ins-text-gray)]">
							{/* <p>{summary}</p> */}
							{saving && <p className="text-[var(--secondary-color)] font-semibold mt-1">Guardando cambios...</p>}
							{!saving && feedback && <p className="text-emerald-300 font-semibold mt-1">{feedback}</p>}
						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8 items-start w-full px-0 mx-0">
					<div className="w-full">
						<div className="p-0">
							<div className="flex flex-wrap gap-4">
								{statCards.length ? statCards.map((card) => {
									const Icon = card.icon;

									return (
										<div key={card.key} className="flex items-center gap-3 rounded-2xl">
											<div className={`shrink-0 rounded-2xl p-3 ${card.accentClassName}`}>
												<Icon size={18} />
											</div>
											<div className="flex min-w-0 items-baseline gap-2">
												<p className="text-2xl font-black text-[var(--ins-text-white)]">{card.value}</p>
												<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ins-text-gray)]">{card.label}</p>
											</div>
										</div>
									);
								}) : <p className="text-sm text-[var(--ins-text-gray)]">No hay estadísticas disponibles todavía.</p>}
							</div>

						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8 items-start w-full px-0 mx-0 mt-8">
					<div className="w-full">
						<div>
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
								<EmblemsColumn
									icon={LayoutGrid}
									title="Todas las insignias"
									subtitle="Insignias obtenidas que no estan equipadas"
									items={availableEmblems}
									columnId="available"
									loading={loading}
									onDragStart={setDragState}
									onDropItem={handleDropOnColumn}
									onDropColumn={handleDropOnColumn}
									activeDrag={dragState}
								/>
								<EmblemsColumn
									icon={ShieldCheck}
									title="Insignias equipadas"
									subtitle="Su orden define como se muestran en tu credencial"
									items={equippedEmblems}
									columnId="equipped"
									loading={loading}
									onDragStart={setDragState}
									onDropItem={handleDropOnColumn}
									onDropColumn={handleDropOnColumn}
									activeDrag={dragState}
								/>
							</div>
							{error ? (
								<div className="mt-5 flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">
									<p className="flex-1 text-sm text-red-300">{error}</p>
									<button
										type="button"
										onClick={loadProgress}
										className="shrink-0 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/25 transition-colors"
									>
										<RefreshCw size={13} />
										Reintentar
									</button>
								</div>
							) : null}
						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8 items-start w-full px-0 mx-0 mt-8">
					<div className="w-full box-main p-6">
						<div className="mb-6 flex items-start gap-3">
							<Award size={22} className="mt-1 text-[var(--secondary-color)]" />
							<div>
								<h2 className="text-xl font-bold text-[var(--ins-text-white)]">Logros</h2>
								<p className="mt-2 text-sm text-[var(--ins-text-gray)]">Progreso de tus metas y recompensas.</p>
							</div>
						</div>
						<AchievementsPanel />
					</div>
				</div>
			</div>
		</div>
	);
}

function EmblemsColumn({
	icon: Icon,
	title,
	subtitle,
	items,
	columnId,
	loading,
	onDragStart,
	onDropItem,
	onDropColumn,
	activeDrag,
}) {
	const isDraggedFromHere = activeDrag?.column === columnId;

	return (
		<div
			className={`rounded-3xl border min-h-[260px] p-5 transition-colors ${isDraggedFromHere ? "box-main" : "box-main"}`}
			onDragOver={(event) => event.preventDefault()}
			onDrop={() => onDropColumn(columnId)}
		>
			<div className="flex items-start justify-between gap-4 mb-5">
				<div>
					<h2 className="text-xl font-bold flex items-center gap-2">
						<Icon size={22} style={{ color: "var(--secondary-color)" }} />
						{title}
					</h2>
					<p className="text-sm text-[var(--ins-text-gray)] mt-2">{subtitle}</p>
				</div>
				<span className="inline-flex min-w-10 h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-[var(--secondary-color)]">
					{items.length}
				</span>
			</div>

			{loading ? (
				<div className="rounded-2xl border border-dashed border-white/10 min-h-[180px] flex items-center justify-center text-sm text-[var(--ins-text-gray)]">
					Cargando insignias...
				</div>
			) : items.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-white/10 min-h-[180px] flex items-center justify-center text-center text-sm text-[var(--ins-text-gray)] px-6">
					Arrastra insignias aqui.
				</div>
			) : (
				<div className="space-y-3">
					{items.map((item, index) => (
						<EmblemCard
							key={item.id}
							item={item}
							index={index}
							columnId={columnId}
							onDragStart={onDragStart}
							onDropItem={onDropItem}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function EmblemCard({ item, index, columnId, onDragStart, onDropItem }) {
	const emblem = item?.emblem || {};
	const emblemColor = emblem.color || "#9CA3AF";
	const rarityClassName = badgeRarityClasses[String(emblem.rarity || "common").toLowerCase()] || badgeRarityClasses.common;

	return (
		<div
			draggable
			tabIndex={0}
			onDragStart={() => onDragStart({ column: columnId, index, itemId: item.id })}
			onDragEnd={() => onDragStart(null)}
			onDragOver={(event) => event.preventDefault()}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				onDropItem(columnId, index);
			}}
			className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/50"
			title={emblem.description || emblem.name || "Insignia"}
		>
			<div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-black/20 border-2" style={{ borderColor: emblemColor }}>
				{emblem.iconUrl ? (
					<img src={emblem.iconUrl} alt={emblem.name || "Insignia"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
				) : (
					<Award size={24} style={{ color: emblemColor }} />
				)}
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="font-bold text-[var(--ins-text-white)] truncate">{emblem.name || "Insignia"}</p>
						<p className="text-sm text-[var(--ins-text-gray)] line-clamp-2">{emblem.description || "Sin descripcion"}</p>
					</div>
					<GripVertical size={16} className="shrink-0 mt-1 text-[var(--ins-text-gray)] group-hover:text-[var(--secondary-color)]" />
				</div>

				<div className="flex items-center gap-2 mt-2">
					<span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${rarityClassName}`}>
						{emblem.rarity || "common"}
					</span>
					{item.edition?.name ? (
						<span className="text-[11px] text-[var(--ins-text-gray)] truncate">{item.edition.name}</span>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default Progress;
