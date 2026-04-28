import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import api from "../../api/axios";
import Credencial from "../../components/Credencial";
import LoadingOverlay from "../../components/LoadingOverlay";

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
	const [loading, setLoading] = useState(true);
	const [showScrollTop, setShowScrollTop] = useState(false);
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
	const hasLoadedOnce = useRef(false);
	const sentinelRef = useRef(null);

	useEffect(() => {
		setSearch(String(searchParams.get("search") || ""));
	}, [searchParams]);

	useEffect(() => {
		if (hasLoadedOnce.current) return;
		hasLoadedOnce.current = true;

		const loadPlayers = async () => {
			try {
				setLoading(true);
				const { data } = await api.get("/user/players");
				setPlayers(Array.isArray(data?.players) ? data.players : []);
			} catch (error) {
				console.error("Players load error:", error);
				setPlayers([]);
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
		if (!query) return players;

		return players.filter((player) => {
			const role = String(player?.role || "").toLowerCase();
			const username = String(player?.username || "").toLowerCase();
			const folio = String(player?.folio || "").toLowerCase();
			const status = String(player?.status || "").toLowerCase();
			return role.includes(query) || username.includes(query) || folio.includes(query) || status.includes(query);
		});
	}, [players, search]);

	useEffect(() => {
		setVisibleCount(BATCH_SIZE);
	}, [filteredPlayers.length]);

	useEffect(() => {
		if (loading) return;
		if (!sentinelRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (!entry?.isIntersecting) return;

				setVisibleCount((prev) => {
					if (prev >= filteredPlayers.length) return prev;
					return Math.min(prev + BATCH_SIZE, filteredPlayers.length);
				});
			},
			// Prefetch band: dispara la siguiente carga cuando faltan ~2 filas visibles.
			{ root: null, rootMargin: `0px 0px ${PREFETCH_BAND_PX}px 0px`, threshold: 0.01 }
		);

		observer.observe(sentinelRef.current);

		return () => {
			observer.disconnect();
		};
	}, [loading, filteredPlayers.length]);

	const visiblePlayers = useMemo(() => {
		return filteredPlayers.slice(0, visibleCount);
	}, [filteredPlayers, visibleCount]);

	const statusConfig = {
		ACTIVE: { label: "Activo" },
		PENDING: { label: "Pendiente" },
		INACTIVE: { label: "Inactivo" },
		BANNED: { label: "Suspendido" },
	};

	return (
		<div className="min-h-screen h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
			<LoadingOverlay isVisible={loading} message="Cargando credenciales" />
			<div className="w-full px-4 md:px-8 text-[var(--ins-text-white)]">
				<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
					<div>
						<div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
							<span>{currentUser.role}</span>
							<span>/</span>
							<span className="text-[var(--secondary-color)]">Jugadores</span>
						</div>

						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Credenciales del Sistema</h1>
						<p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-2xl">
							Visualiza todas las credenciales de jugadores registradas en TierraDeTodos.
						</p>
					</div>

					<div className="relative w-full md:w-[360px]">
						<input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Buscar por usuario, folio, rol o estatus..."
							className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/20 text-sm text-white placeholder:text-white/45 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/45 transition-all"
						/>
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" size={18} />
					</div>
				</div>

				{filteredPlayers.length === 0 ? (
					<div className="rounded-3xl bg-black/10 py-14 text-center text-[var(--ins-text-gray)]">
						No se encontraron jugadores con ese filtro.
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 justify-items-center  bg-black/10 rounded-3xl p-6">
							{visiblePlayers.map((player) => {
							const normalizedStatus = String(player?.status || "").toUpperCase();
							const currentStatus = {
								label: statusConfig[normalizedStatus]?.label || "Desconocido",
								color: player?.statusColor || "#8a8a8a",
							};

							return (
								<Credencial
									key={player.id}
									user={player}
									currentStatus={currentStatus}
									isInactiveStatus={normalizedStatus === "INACTIVE"}
									isCancelledStatus={normalizedStatus === "BANNED"}
									lazyImages
									readOnly
								/>
							);
							})}
						</div>

						<div ref={sentinelRef} className="w-full h-12" />

						{visibleCount < filteredPlayers.length && (
							<div className="text-center text-xs text-[var(--ins-text-gray)] pb-6">
								Mostrando {visibleCount} de {filteredPlayers.length} credenciales...
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

export default Players;

