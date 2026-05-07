import { useEffect, useMemo, useState } from "react";
import { Award, BarChart3, CheckCircle2, GripVertical, LayoutGrid, ShieldCheck, TrendingUp } from "lucide-react";

import api from "../../api/axios";

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
	const [userGoals, setUserGoals] = useState([]);
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
			const { data } = await api.get("/user/progress/emblems");
			const normalized = normalizePayload(data);
			setAvailableEmblems(normalized.available);
			setEquippedEmblems(normalized.equipped);
			setUserGoals(Array.isArray(data?.userGoals) ? data.userGoals : []);
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
			setUserGoals([]);
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

		const sourceList = sourceColumn === "equipped" ? equippedEmblems : availableEmblems;
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
			key: "total-emblems",
			label: "Insignias obtenidas",
			value: stats.totalEmblems,
			helper: `${stats.equippedEmblems} equipadas`,
			icon: Award,
			accentClassName: "text-amber-300 bg-amber-500/15",
		},
		{
			key: "completed-goals",
			label: "Logros completados",
			value: stats.completedGoals,
			helper: `${stats.totalGoals} registrados`,
			icon: CheckCircle2,
			accentClassName: "text-emerald-300 bg-emerald-500/15",
		},
		{
			key: "in-progress-goals",
			label: "Logros en progreso",
			value: stats.inProgressGoals,
			helper: `${stats.totalGoalProgress} de avance acumulado`,
			icon: TrendingUp,
			accentClassName: "text-sky-300 bg-sky-500/15",
		},
		{
			key: "completion-average",
			label: "Avance promedio",
			value: `${stats.averageGoalCompletion}%`,
			helper: "Sobre todos tus logros guardados",
			icon: BarChart3,
			accentClassName: "text-fuchsia-300 bg-fuchsia-500/15",
		},
	]), [stats]);

	const highlightedGoals = useMemo(() => {
		const ordered = [...userGoals].sort((left, right) => {
			if (Boolean(left?.isCompleted) !== Boolean(right?.isCompleted)) {
				return left?.isCompleted ? -1 : 1;
			}

			const leftRatio = left?.goal?.targetValue ? (Number(left?.progress) || 0) / Math.max(Number(left.goal.targetValue) || 1, 1) : 0;
			const rightRatio = right?.goal?.targetValue ? (Number(right?.progress) || 0) / Math.max(Number(right.goal.targetValue) || 1, 1) : 0;
			return rightRatio - leftRatio;
		});

		return ordered.slice(0, 4);
	}, [userGoals]);

	return (
		<div>
			<div className="min-h-screen py-15 flex flex-col items-center pb-24 text-[var(--white-color)] z-[1] h-screen">
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
								Organiza tus insignias arrastrandolas entre columnas. El orden dentro de Insignias equipadas es el que se usa en tu credencial.
							</p>
						</div>
						<div className="text-right text-sm text-[var(--ins-text-gray)]">
							<p>{summary}</p>
							{saving && <p className="text-[var(--secondary-color)] font-semibold mt-1">Guardando cambios...</p>}
							{!saving && feedback && <p className="text-emerald-300 font-semibold mt-1">{feedback}</p>}
						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8 items-start w-full px-0 mx-0 mb-4">
					<div className="w-full">
						<div className="">
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
							{error ? <p className="mt-5 text-sm text-red-300">{error}</p> : null}
						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8 items-start w-full px-0 mx-0">
					<div className="w-full">
						<div className="box-main p-6">
							<div className="flex items-start justify-between gap-4 mb-6">
								<div>
									<h2 className="text-xl font-bold flex items-center gap-2 text-[var(--ins-text-white)]">
										<BarChart3 size={22} style={{ color: "var(--secondary-color)" }} />
										Estadisticas del jugador
									</h2>
									<p className="text-sm text-[var(--ins-text-gray)] mt-2">
										Resumen de insignias y logros guardados para esta cuenta.
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
								{statCards.map((card) => {
									const Icon = card.icon;
									return (
										<div key={card.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[var(--ins-text-gray)]">{card.label}</p>
													<p className="text-2xl font-black text-[var(--ins-text-white)] mt-2">{card.value}</p>
												</div>
												<div className={`shrink-0 rounded-2xl p-3 ${card.accentClassName}`}>
													<Icon size={18} />
												</div>
											</div>
											<p className="text-xs text-[var(--ins-text-gray)] mt-3">{card.helper}</p>
										</div>
									);
								})}
							</div>

							<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
								<div className="flex items-center justify-between gap-4 mb-4">
									<div>
										<h3 className="text-lg font-bold text-[var(--ins-text-white)]">Logros destacados</h3>
										<p className="text-sm text-[var(--ins-text-gray)] mt-1">Tus logros completados o con mayor progreso.</p>
									</div>
								</div>

								{loading ? (
									<div className="text-sm text-[var(--ins-text-gray)]">Cargando estadisticas...</div>
								) : highlightedGoals.length === 0 ? (
									<div className="text-sm text-[var(--ins-text-gray)]">Aun no hay logros con progreso guardado.</div>
								) : (
									<div className="space-y-3">
										{highlightedGoals.map((item) => {
											const targetValue = Math.max(Number(item?.goal?.targetValue) || 0, 1);
											const progressPercent = item?.isCompleted ? 100 : Math.min(Math.round(((Number(item?.progress) || 0) / targetValue) * 100), 100);
											const emblemColor = item?.goal?.emblem?.color || "#9CA3AF";

											return (
												<div key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
													<div className="flex items-start justify-between gap-4">
														<div className="min-w-0 flex items-start gap-3">
															<div className="w-12 h-12 rounded-2xl border-2 overflow-hidden flex items-center justify-center bg-black/20 shrink-0" style={{ borderColor: emblemColor }}>
																{item?.goal?.emblem?.iconUrl ? (
																	<img src={item.goal.emblem.iconUrl} alt={item.goal.emblem.name || item.goal.title || "Logro"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
																) : (
																	<Award size={18} style={{ color: emblemColor }} />
																)}
															</div>
															<div className="min-w-0">
																<p className="font-bold text-[var(--ins-text-white)] truncate">{item?.goal?.title || "Logro"}</p>
																<p className="text-sm text-[var(--ins-text-gray)] line-clamp-2">{item?.goal?.description || "Sin descripcion"}</p>
															</div>
														</div>
														<span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${item?.isCompleted ? "bg-emerald-500/15 text-emerald-300" : "bg-sky-500/15 text-sky-300"}`}>
															{item?.isCompleted ? "Completado" : `${progressPercent}%`}
														</span>
													</div>
													<div className="mt-3">
														<div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
															<div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, backgroundColor: emblemColor }} />
														</div>
														<p className="text-xs text-[var(--ins-text-gray)] mt-2">
															{item?.isCompleted ? `Completado ${item.completedAt ? new Date(item.completedAt).toLocaleDateString("es-MX") : ""}`.trim() : `${Number(item?.progress) || 0} / ${targetValue} de progreso`}
														</p>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
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
			className={`rounded-3xl border min-h-[420px] p-5 transition-colors ${isDraggedFromHere ? "box-main" : "box-main"}`}
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
				<div className="rounded-2xl border border-dashed border-white/10 min-h-[300px] flex items-center justify-center text-sm text-[var(--ins-text-gray)]">
					Cargando insignias...
				</div>
			) : items.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-white/10 min-h-[300px] flex items-center justify-center text-center text-sm text-[var(--ins-text-gray)] px-6">
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
			onDragStart={() => onDragStart({ column: columnId, index, itemId: item.id })}
			onDragEnd={() => onDragStart(null)}
			onDragOver={(event) => event.preventDefault()}
			onDrop={(event) => {
				event.preventDefault();
				event.stopPropagation();
				onDropItem(columnId, index);
			}}
			className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5"
			title={emblem.description || emblem.name || "Insignia"}
		>
			<div className="shrink-0 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-black/20 border-2" style={{ borderColor: emblemColor }}>
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

				<div className="flex items-center gap-2 mt-3">
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
