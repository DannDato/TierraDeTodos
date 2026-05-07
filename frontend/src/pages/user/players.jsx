import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Clock3, ShieldCheck, Sparkles, UserRound, Users, X, BrickWall,TableProperties } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";


import api from "../../api/axios";
import Credencial from "../../components/user/Credencial";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import Button from "../../elements/Button";
import InfoRow from "../../elements/InfoRow";
import Select from "../../elements/Select";
import Table from "../../elements/Table";
import Tabbar from "../../elements/Tabbar";

// Oculta el scroll global del body cuando este componente está montado
function useHideBodyScrollbar() {
	useEffect(() => {
		document.body.classList.add("scrollbar-hidden");
		return () => {
			document.body.classList.remove("scrollbar-hidden");
		};
	}, []);
}

function Players() {
	useHideBodyScrollbar();
	const navigate = useNavigate();
	const BATCH_SIZE = 18;
	const PREFETCH_ROWS = 2;
	const ESTIMATED_CARD_HEIGHT = 560;
	const PREFETCH_BAND_PX = PREFETCH_ROWS * ESTIMATED_CARD_HEIGHT;

	const currentUser = {
		username: localStorage.getItem("username"),
		role: localStorage.getItem("role"),
	};

	const [players, setPlayers] = useState([]);
	const [searchParams] = useSearchParams();
	const [search, setSearch] = useState(() => String(searchParams.get("search") || ""));
	const [roleFilter, setRoleFilter] = useState("ALL");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [sortBy, setSortBy] = useState("recent");
	const [viewMode, setViewMode] = useState("grid");
	const [loading, setLoading] = useState(true);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
	const [canOpenTickets, setCanOpenTickets] = useState(false);
	const [selectedPlayer, setSelectedPlayer] = useState(null);
	const hasLoadedOnce = useRef(false);
	const sentinelRef = useRef(null);
	const openTimerRef = useRef(null);

	useEffect(() => {
		setSearch(String(searchParams.get("search") || ""));
	}, [searchParams]);

	useEffect(() => {
		if (hasLoadedOnce.current) return;
		hasLoadedOnce.current = true;

		const loadPlayers = async () => {
			try {
				setLoading(true);
				const [playersResponse, menuResponse] = await Promise.allSettled([
					api.get("/user/players"),
					api.get("/system/menu"),
				]);

				if (playersResponse.status === "fulfilled") {
					setPlayers(Array.isArray(playersResponse.value?.data?.players) ? playersResponse.value.data.players : []);
				} else {
					setPlayers([]);
				}

				if (menuResponse.status === "fulfilled") {
					const permissions = Array.isArray(menuResponse.value?.data?.permissions)
						? menuResponse.value.data.permissions
						: [];
					setCanOpenTickets(permissions.includes("menu.tickets"));
				} else {
					setCanOpenTickets(false);
				}
			} catch (error) {
				console.error("Players load error:", error);
				setPlayers([]);
				setCanOpenTickets(false);
			} finally {
				setLoading(false);
			}
		};

		loadPlayers();
	}, []);

	useEffect(() => {
		const scrollContainer = document.querySelector("main");
		const target = scrollContainer || window;

		const handleScroll = () => {
			const top = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
			setShowScrollTop(top > 480);
		};

		handleScroll();
		target.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			target.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const handleScrollTop = () => {
		const scrollContainer = document.querySelector("main");
		if (scrollContainer) {
			scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const filteredPlayers = useMemo(() => {
		const query = search.trim().toLowerCase();

		return players.filter((player) => {
			const role = String(player?.role || "").toLowerCase();
			const username = String(player?.username || "").toLowerCase();
			const folio = String(player?.folio || "").toLowerCase();
			const status = String(player?.status || "").toLowerCase();

			if (roleFilter !== "ALL" && String(player?.role || "").toUpperCase() !== roleFilter) {
				return false;
			}

			if (statusFilter !== "ALL" && String(player?.status || "").toUpperCase() !== statusFilter) {
				return false;
			}

			if (!query) {
				return true;
			}

			return role.includes(query) || username.includes(query) || folio.includes(query) || status.includes(query);
		});
	}, [players, roleFilter, search, statusFilter]);

	const sortedPlayers = useMemo(() => {
		const source = [...filteredPlayers];

		source.sort((left, right) => {
			if (sortBy === "az") {
				return String(left?.username || "").localeCompare(String(right?.username || ""), "es", {
					sensitivity: "base",
				});
			}

			if (sortBy === "oldest") {
				const leftTime = new Date(left?.createdAt || 0).getTime();
				const rightTime = new Date(right?.createdAt || 0).getTime();
				return leftTime - rightTime;
			}

			const leftTime = new Date(left?.createdAt || 0).getTime();
			const rightTime = new Date(right?.createdAt || 0).getTime();
			return rightTime - leftTime;
		});

		return source;
	}, [filteredPlayers, sortBy]);

	const roleOptions = useMemo(() => {
		const uniqueRoles = [...new Set(players.map((player) => String(player?.role || "").toUpperCase()).filter(Boolean))]
			.sort((left, right) => left.localeCompare(right, "es", { sensitivity: "base" }));

		return [{ value: "ALL", label: "Todos los roles" }, ...uniqueRoles.map((role) => ({ value: role, label: role }))];
	}, [players]);

	const statusOptions = useMemo(() => {
		const uniqueStatuses = [...new Set(players.map((player) => String(player?.status || "").toUpperCase()).filter(Boolean))]
			.sort((left, right) => left.localeCompare(right, "es", { sensitivity: "base" }));

		return [{ value: "ALL", label: "Todos los estatus" }, ...uniqueStatuses.map((status) => ({ value: status, label: status }))];
	}, [players]);

	useEffect(() => {
		setVisibleCount(BATCH_SIZE);
	}, [sortedPlayers.length]);

	useEffect(() => {
		if (loading) return;
		if (!sentinelRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (!entry?.isIntersecting) return;

				setVisibleCount((prev) => {
					if (prev >= sortedPlayers.length) return prev;
					return Math.min(prev + BATCH_SIZE, sortedPlayers.length);
				});
			},
			// Prefetch band: dispara la siguiente carga cuando faltan ~2 filas visibles.
			{ root: null, rootMargin: `0px 0px ${PREFETCH_BAND_PX}px 0px`, threshold: 0.01 }
		);

		observer.observe(sentinelRef.current);

		return () => {
			observer.disconnect();
		};
	}, [loading, sortedPlayers.length]);

	const visiblePlayers = useMemo(() => {
		return sortedPlayers.slice(0, visibleCount);
	}, [sortedPlayers, visibleCount]);

	useEffect(() => {
		return () => {
			if (openTimerRef.current) {
				window.clearTimeout(openTimerRef.current);
			}
		};
	}, []);

	const handleCardClick = (player) => {
		if (openTimerRef.current) {
			window.clearTimeout(openTimerRef.current);
		}

		openTimerRef.current = window.setTimeout(() => {
			setSelectedPlayer(player);
			openTimerRef.current = null;
		}, 220);
	};

	const handleCardDoubleClick = () => {
		if (openTimerRef.current) {
			window.clearTimeout(openTimerRef.current);
			openTimerRef.current = null;
		}
	};

	const closeQuickProfile = () => {
		setSelectedPlayer(null);
	};

	const handleOpenTicket = () => {
		if (!selectedPlayer) return;
		navigate(`/tickets?type=REPORTE&subject=Reporte%20sobre%20${encodeURIComponent(String(selectedPlayer.username || "jugador"))}`);
		closeQuickProfile();
	};

	const statusConfig = {
		ACTIVE: { label: "Activo" },
		PENDING: { label: "Pendiente" },
		INACTIVE: { label: "Inactivo" },
		BANNED: { label: "Suspendido" },
	};

	const sortOptions = [
		{ value: "recent", label: "Mas recientes" },
		{ value: "oldest", label: "Mas antiguos" },
		{ value: "az", label: "A - Z" },
	];

	const tableColumns = [
		{
			key: "username",
			header: "Jugador",
			cellClassName: "text-[var(--ins-text-white)] font-bold",
			render: (player) => player?.username || "N/A",
		},
		{
			key: "role",
			header: "Rol",
			cellClassName: "text-[var(--ins-text-white)]",
			render: (player) => player?.role || "N/A",
		},
		{
			key: "status",
			header: "Estatus",
			cellClassName: "text-[var(--ins-text-white)]",
			render: (player) => statusConfig[String(player?.status || "").toUpperCase()]?.label || "Desconocido",
		},
		{
			key: "createdAt",
			header: "Registro",
			cellClassName: "text-[var(--ins-text-gray)]",
			render: (player) => {
				const createdAt = player?.createdAt ? new Date(player.createdAt) : null;
				if (!createdAt || Number.isNaN(createdAt.getTime())) return "N/A";
				return createdAt.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
			},
		},
		{
			key: "emblems",
			header: "Insignias",
			cellClassName: "text-[var(--ins-text-white)]",
			render: (player) => {
				const count = Array.isArray(player?.equippedEmblems) ? player.equippedEmblems.length : 0;
				return `${count}`;
			},
		},
		{
			key: "actions",
			header: "Acciones",
			headerClassName: "text-right",
			cellClassName: "text-right",
			render: (player) => (
				<Button variant="ghost" size="sm" onClick={() => setSelectedPlayer(player)}>
					Ver perfil rapido
				</Button>
			),
		},
	];

	return (
		<div className="min-h-screen h-screen py-15 flex items-start justify-center pb-24">
			<LoadingOverlay isVisible={loading} message="Cargando jugadores" />

			{selectedPlayer ? (
				<QuickProfileModal
					player={selectedPlayer}
					onClose={closeQuickProfile}
					canOpenTickets={canOpenTickets}
					onOpenTicket={handleOpenTicket}
					currentStatus={statusConfig[String(selectedPlayer?.status || "").toUpperCase()]?.label || "Desconocido"}
				/>
			) : null}

			<div className="w-full px-0 mx-0 text-[var(--ins-text-white)]">
				<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
					<div className="px-2">
						<div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
							<span>{currentUser.role}</span>
							<span>/</span>
							<span className="text-[var(--secondary-color)]">Jugadores</span>
						</div>

						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Jugadores</h1>
						<p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-2xl leading-relaxed">
							Visualiza todas las credenciales de jugadores registradas en TierraDeTodos.
						</p>
					</div>

					<div className="w-full ">
						<div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">

							<div className="flex flex-wrap gap-2 justify-end w-full">
								<div className="w-full sm:w-[170px]">
									<Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
								</div>
								<div className="w-full sm:w-[170px]">
									<Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
								</div>
								<div className="w-full sm:w-[170px]">
									<Select value={sortBy} onChange={setSortBy} options={sortOptions} />
								</div>

							</div>
							<div className="relative ml-auto">
								<input
									type="text"
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Buscar por usuario, folio, rol o estatus..."
									className="bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-xl px-4 py-2.5 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-gray)] focus:outline-none focus:border-[var(--secondary-color)]/50 transition-colors min-w-[300px]"
								/>
								{search ? (
									<button
										type="button"
										onClick={() => setSearch("")}
										className="absolute left-68 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors"
									>
										<X size={14} />
									</button>
								) : null}
							</div>
						</div>
					</div>
				</div>

				{sortedPlayers.length === 0 ? (
					<div className="box-main py-14 text-center text-[var(--ins-text-gray)]">
						No se encontraron jugadores con ese filtro.
					</div>
				) : (
					<>
						<div className="box-main lg:p-6 relative overflow-hidden">
							<div className="flex flex-wrap justify-between mb-10">
								<div className="p-5">
									<h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--ins-text-white)] ">
										<Users size={24} style={{ color: "var(--secondary-color)" }}/>
										Todos los ciudadanos
									</h2>
									<p className="text-xs text-[var(--ins-text-gray)] mb-4 uppercase tracking-[0.18em]">
										Mostrando {Math.min(visibleCount, sortedPlayers.length)} de {sortedPlayers.length} miembros
									</p>
								</div>
								<div className="flex items-center justify-end gap-2 sm:w-auto p-5">
									<Tabbar
										tabs={[
											{ id: "grid", label: "Grid", icon: <BrickWall size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
											{ id: "table", label: "Table", icon: <TableProperties size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
										]}
										activeTab={viewMode}
										onChange={setViewMode}
									/>
								</div>

							</div>

							{viewMode === "grid" ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 justify-items-center">
									{visiblePlayers.map((player) => {
								const normalizedStatus = String(player?.status || "").toUpperCase();
								const currentStatus = {
									label: statusConfig[normalizedStatus]?.label || "Desconocido",
									color: player?.statusColor || "#8a8a8a",
								};

								return (
									<div
										key={player.id}
										className="w-full flex flex-col items-center"
										onClick={() => handleCardClick(player)}
										onDoubleClick={handleCardDoubleClick}
									>
										<Credencial
											user={player}
											currentStatus={currentStatus}
											isInactiveStatus={normalizedStatus === "INACTIVE"}
											isCancelledStatus={normalizedStatus === "BANNED"}
											lazyImages
											readOnly
										/>
										<Button variant="ghost" size="sm" className="mt-2" onClick={() => setSelectedPlayer(player)}>
											Ver perfil rapido
										</Button>
									</div>
								);
									})}
								</div>
							) : (
								<Table
									columns={tableColumns}
									data={visiblePlayers}
									rowKey="id"
									onRowClick={(player) => setSelectedPlayer(player)}
									layout="embedded"
									preset="compactMuted"
									enablePagination={false}
									maxHeight="max-h-[34rem]"
									minWidth="min-w-[980px]"
									emptyColSpan={6}
									emptyMessage="No hay jugadores para mostrar."
								/>
							)}
						</div>

						<div ref={sentinelRef} className="w-full h-12" />

						{visibleCount < sortedPlayers.length && (
							<div className="text-center text-xs text-[var(--ins-text-gray)] pb-6">
								Mostrando {visibleCount} de {sortedPlayers.length} jugadores...
							</div>
						)}
					</>
				)}
			</div>

			{showScrollTop && (
				<button
					type="button"
					onClick={handleScrollTop}
					className="fixed right-5 md:right-7 bottom-24 z-40 w-11 h-11 rounded-full bg-[var(--secondary-color)] text-white shadow-lg shadow-black/30 hover:bg-[var(--hover-secondary)] transition-colors flex items-center justify-center"
					title="Volver arriba"
				>
					<ArrowUp size={20} />
				</button>
			)}
		</div>
	);
}

function QuickProfileModal({ player, onClose, canOpenTickets, onOpenTicket, currentStatus }) {
	const equippedEmblems = Array.isArray(player?.equippedEmblems) ? player.equippedEmblems : [];
	const latestVisibleAchievements = [...equippedEmblems]
		.sort((left, right) => (Number(left?.order) || 0) - (Number(right?.order) || 0))
		.slice(0, 4);

	const createdDate = player?.createdAt ? new Date(player.createdAt) : null;
	const registeredAt = createdDate && !Number.isNaN(createdDate.getTime())
		? createdDate.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
		: "N/A";

	const accountAgeDays = createdDate && !Number.isNaN(createdDate.getTime())
		? Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)))
		: null;

	const progressSummary = equippedEmblems.length === 0
		? "Sin logros visibles aun."
		: equippedEmblems.length === 1
			? "1 insignia visible en su perfil."
			: `${equippedEmblems.length} insignias visibles en su perfil.`;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
			<div className="absolute inset-0 " onClick={onClose} />
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
			<div className="relative w-full max-w-5xl overflow-hidden max-h-[88vh] flex flex-col modal-main">
				<div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
					<div>
						<h3 className="text-2xl font-extrabold text-[var(--ins-text-white)] flex items-center gap-2">
							<UserRound size={22} className="text-[var(--secondary-color)]"/> Perfil rapido
						</h3>
						<p className="text-xs uppercase tracking-[0.18em] text-[var(--ins-text-gray)] mt-1">
							Jugador: {player?.username || "N/A"}
						</p>
					</div>
					<Button variant="ghost" size="sm" onClick={onClose} className="px-3">
						<X size={16} />
					</Button>
				</div>

				<div className="p-6 overflow-y-auto tdt-scrollbar">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
						<div className="flex justify-center">
							<Credencial
								user={player}
								currentStatus={{
									label: currentStatus || "Desconocido",
									color: player?.statusColor || "#8a8a8a",
								}}
								isInactiveStatus={String(player?.status || "").toUpperCase() === "INACTIVE"}
								isCancelledStatus={String(player?.status || "").toUpperCase() === "BANNED"}
								lazyImages
								readOnly
							/>
						</div>

						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<InfoRow icon={<UserRound size={16} />} label="Nombre" value={player?.username || "N/A"} />
								<InfoRow icon={<ShieldCheck size={16} />} label="Rol" value={player?.role || "N/A"} />
								<InfoRow icon={<Sparkles size={16} />} label="Estatus" value={currentStatus || "Desconocido"} />
								<InfoRow icon={<Users size={16} />} label="Comunidad" value={player?.communityName || "TierraDeTodos"} />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<InfoRow icon={<Clock3 size={16} />} label="Registro" value={registeredAt} />
								<InfoRow icon={<Clock3 size={16} />} label="Antiguedad" value={accountAgeDays === null ? "N/A" : `${accountAgeDays} dias`} />
							</div>

							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-[var(--ins-text-gray)] mb-2">Insignias y progreso</p>
								<p className="text-sm text-[var(--ins-text-white)] font-semibold">{progressSummary}</p>
								<div className="mt-3 flex flex-wrap gap-2">
									{latestVisibleAchievements.length ? latestVisibleAchievements.map((achievement) => (
										<span
											key={`${achievement.emblemId || achievement.id}-${achievement.order || 0}`}
											className="px-2.5 py-1 rounded-full text-xs border border-white/15 bg-black/20 text-[var(--ins-text-white)]"
											title={achievement?.description || achievement?.name || "Insignia"}
										>
											{achievement?.name || "Insignia"}
										</span>
									)) : (
										<span className="text-xs text-[var(--ins-text-gray)]">Sin insignias visibles todavia.</span>
									)}
								</div>
							</div>

							<div className="flex flex-wrap gap-2 pt-2">
								{canOpenTickets ? (
									<Button variant="primary" size="sm" onClick={onOpenTicket}>
										Abrir ticket de reporte
									</Button>
								) : null}
								<Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Players;

