import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, Search, X } from "lucide-react";

import api from "../../../api/axios";
import AlertModal from "../../../elements/AlertModal";
import Button from "../../../elements/Button";
import CloseButton from "../../../elements/closeButton";
import Input from "../../../elements/Input";
import Table from "../../../elements/Table";
import Textarea from "../../../elements/Textarea";
import LoadingOverlay from "../../shared/LoadingOverlay";

const buildInitialForm = () => ({
	id: null,
	command: "",
	description: "",
	details: "",
	permissions: [],
	active: true,
});

const truncateText = (value, maxLength = 40) => {
	const normalized = String(value || "").trim();
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const summarizePermissions = (permissions = []) => {
	if (!Array.isArray(permissions) || permissions.length === 0) {
		return "Sin permisos";
	}

	if (permissions.length === 1) {
		return permissions[0];
	}

	return `${permissions[0]} +${permissions.length - 1}`;
};

function CommandsManager() {
	const [loading, setLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [commands, setCommands] = useState([]);
	const [availablePermissions, setAvailablePermissions] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCommand, setSelectedCommand] = useState(null);
	const [alertConfig, setAlertConfig] = useState({
		isOpen: false,
		type: "info",
		title: "Aviso",
		message: "",
	});

	const pendingActionRef = useRef(null);

	useEffect(() => {
		loadData();
	}, []);

	const openAlert = ({ type = "info", title = "Aviso", message = "", onConfirm = null }) => {
		pendingActionRef.current = onConfirm;
		setAlertConfig({ isOpen: true, type, title, message });
	};

	const closeAlert = () => {
		pendingActionRef.current = null;
		setAlertConfig((prev) => ({ ...prev, isOpen: false }));
	};

	const handleAlertConfirm = async () => {
		const action = pendingActionRef.current;
		closeAlert();
		if (typeof action === "function") {
			await action();
		}
	};

	const normalizeCommand = (item) => ({
		id: item?.id ?? null,
		command: String(item?.command || "").trim(),
		description: String(item?.description || "").trim(),
		details: String(item?.details || "").trim(),
		permissions: Array.isArray(item?.permissions) ? item.permissions.filter(Boolean) : [],
		active: Boolean(item?.active),
	});

	const loadData = async () => {
		try {
			setLoading(true);
			const [commandsResult, permissionsResult] = await Promise.all([
				api.get("/admin/commands"),
				api.get("/admin/commands/permissions"),
			]);

			const commandsPayload = Array.isArray(commandsResult?.data)
				? commandsResult.data
				: commandsResult?.data?.commands;
			const permissionsPayload = Array.isArray(permissionsResult?.data)
				? permissionsResult.data
				: permissionsResult?.data?.permissions;

			setCommands(Array.isArray(commandsPayload) ? commandsPayload.map(normalizeCommand) : []);
			setAvailablePermissions(Array.isArray(permissionsPayload) ? permissionsPayload : []);
		} catch (error) {
			setCommands([]);
			setAvailablePermissions([]);
			openAlert({
				type: "error",
				title: "No se pudo cargar",
				message: error.response?.data?.message || "No se pudieron cargar los comandos de gestión.",
			});
		} finally {
			setLoading(false);
		}
	};

	const filteredCommands = useMemo(() => {
		const search = String(searchTerm || "").trim().toLowerCase();
		if (!search) return commands;

		return commands.filter((item) => {
			const permissionsText = Array.isArray(item.permissions) ? item.permissions.join(" ") : "";
			return (
				String(item.command || "").toLowerCase().includes(search) ||
				String(item.description || "").toLowerCase().includes(search) ||
				permissionsText.toLowerCase().includes(search) ||
				String(item.active ? "activo" : "inactivo").includes(search)
			);
		});
	}, [commands, searchTerm]);

	const openCreateModal = () => setSelectedCommand(buildInitialForm());

	const handleSave = async (formData) => {
		const payload = {
			command: String(formData?.command || "").trim(),
			description: String(formData?.description || "").trim(),
			details: String(formData?.details || "").trim(),
			permissions: Array.isArray(formData?.permissions) ? formData.permissions.filter(Boolean) : [],
			active: Boolean(formData?.active),
		};

		if (!payload.command || !payload.description) {
			openAlert({
				type: "warning",
				title: "Campos incompletos",
				message: "Comando y descripción son obligatorios.",
			});
			return;
		}

		try {
			setIsSaving(true);
			if (formData?.id) {
				await api.put(`/admin/commands/${formData.id}`, payload);
			} else {
				await api.post("/admin/commands", payload);
			}

			await loadData();
			setSelectedCommand(null);
			openAlert({ type: "success", title: "Guardado", message: "Se guardó correctamente." });
		} catch (error) {
			openAlert({
				type: "error",
				title: "No se pudo guardar",
				message: error.response?.data?.message || "No se pudo guardar el comando.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleToggleActive = async (commandRow) => {
		if (!commandRow?.id) return;

		const previousActive = Boolean(commandRow.active);
		const nextActive = !previousActive;

		setCommands((prev) =>
			prev.map((item) => (item.id === commandRow.id ? { ...item, active: nextActive } : item))
		);

		try {
			await api.put(`/admin/commands/${commandRow.id}`, {
				command: commandRow.command,
				description: commandRow.description,
				details: commandRow.details,
				permissions: commandRow.permissions,
				active: nextActive,
			});
		} catch (error) {
			setCommands((prev) =>
				prev.map((item) => (item.id === commandRow.id ? { ...item, active: previousActive } : item))
			);

			openAlert({
				type: "error",
				title: "No se pudo actualizar",
				message: error.response?.data?.message || "No se pudo cambiar el estado del comando.",
			});
		}
	};

	const commandTableColumns = useMemo(() => ([
		{
			key: "command",
			header: "Comando",
			cellClassName: "text-[var(--ins-text-white)] font-mono",
			render: (item) => item.command,
		},
		{
			key: "description",
			header: "Descripción",
			cellClassName: "text-[var(--ins-text-gray)]",
			getTitle: (item) => item.description || "Sin descripción",
			render: (item) => truncateText(item.description || "Sin descripción", 40),
		},
		{
			key: "permissions",
			header: "Permisos",
			cellClassName: "text-[var(--ins-text-gray)] font-mono text-xs",
			getTitle: (item) => item.permissions.join(", ") || "Sin permisos",
			render: (item) => summarizePermissions(item.permissions),
		},
		{
			key: "active",
			header: "Activo",
			render: (item) => (
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						handleToggleActive(item);
					}}
					className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${
						item.active ? "bg-[var(--secondary-color)] shadow-[0_0_10px_var(--secondary-color)]" : "bg-[var(--black-color)]/50"
					}`}
				>
					<span
						className={`inline-block h-5 w-5 transform rounded-full bg-[var(--white-color)] transition-transform duration-300 shadow-sm ${
							item.active ? "translate-x-6" : "translate-x-1 opacity-70"
						}`}
					/>
				</button>
			),
		},
	]), [handleToggleActive]);

	return (
		<div className="flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
			<LoadingOverlay isVisible={loading || isSaving} />
			<AlertModal
				isOpen={alertConfig.isOpen}
				type={alertConfig.type}
				title={alertConfig.title}
				message={alertConfig.message}
				onClose={closeAlert}
				onConfirm={handleAlertConfirm}
			/>

			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
				<div>
					<h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Gestión de Comandos</h2>
					<p className="text-sm text-[var(--ins-text-gray)] mt-1">
						Controla qué comandos existen, qué permisos los habilitan y si siguen activos dentro del juego.
					</p>
				</div>

				<div className="flex flex-col items-start self-start md:self-end sm:flex-row sm:items-center gap-3 sm:gap-4">
					<div className="relative w-full sm:w-auto">
						<input
							type="text"
							placeholder="Buscar..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-xl px-4 py-2.5 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-gray)] focus:outline-none focus:border-[var(--secondary-color)]/50 transition-colors pr-10"
						/>
						{searchTerm ? (
							<button
								type="button"
								onClick={() => setSearchTerm("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors"
							>
								<X size={14} />
							</button>
						) : (
							<Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] pointer-events-none" size={16} />
						)}
					</div>

					<Button
						variant="primary"
						size="md"
						className="flex items-center gap-2 self-start shrink-0 whitespace-nowrap bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
						onClick={openCreateModal}
					>
						<Plus size={18} /> Nuevo comando
					</Button>
				</div>
			</div>

			<Table
				columns={commandTableColumns}
				data={filteredCommands}
				rowKey="id"
				onRowClick={(row) => setSelectedCommand(row)}
				minWidth="min-w-[760px]"
				emptyMessage="No hay comandos para mostrar."
			/>

			{selectedCommand && (
				<CommandDetailModal
					command={selectedCommand}
					availablePermissions={availablePermissions}
					onClose={() => setSelectedCommand(null)}
					onSave={handleSave}
					isSaving={isSaving}
				/>
			)}
		</div>
	);
}

function CommandDetailModal({ command, availablePermissions, onClose, onSave, isSaving }) {
	const [form, setForm] = useState(() => ({ ...buildInitialForm(), ...command }));

	useEffect(() => {
		setForm({ ...buildInitialForm(), ...command });
	}, [command]);

	const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

	const filteredPermissions = useMemo(() => {
		return availablePermissions;
	}, [availablePermissions]);

	const togglePermission = (permissionKey) => {
		setForm((prev) => {
			const current = Array.isArray(prev.permissions) ? prev.permissions : [];
			const exists = current.includes(permissionKey);
			return {
				...prev,
				permissions: exists ? current.filter((item) => item !== permissionKey) : [...current, permissionKey],
			};
		});
	};

	return (
		<div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-center justify-center p-4 overflow-hidden">
			<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
			<div className="relative w-full max-w-4xl rounded-3xl bg-[var(--ins-background)]/50 backdrop-blur-lg shadow-2xl p-6 max-h-[80dvh] overflow-hidden flex flex-col border border-white/10">
				<div className="flex items-center justify-between mb-6 flex-shrink-0">
					<h3 className="text-xl font-extrabold text-[var(--ins-text-white)]">
						{form.id ? "Editar comando" : "Nuevo comando"}
					</h3>
					<CloseButton onClick={onClose} />
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto tdt-scrollbar pr-1">
					<div className="space-y-4">
						<Input
							label="Comando"
							value={form.command}
							onChange={(e) => patchForm("command", e.target.value)}
							placeholder="/news publicar"
						/>

						<Textarea
							label="Descripción"
							value={form.description}
							onChange={(e) => patchForm("description", e.target.value)}
							placeholder="Resumen corto que aparecerá en la tabla"
							rows={3}
						/>

						<Textarea
							label="Explicación completa"
							value={form.details}
							onChange={(e) => patchForm("details", e.target.value)}
							placeholder="Describe cómo funciona, cuándo se usa y qué resultado debe esperar el usuario"
							rows={5}
						/>

						<div className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
							<div>
								<p className="text-sm font-bold text-[var(--ins-text-white)]">Estado del comando</p>
								<p className="text-xs text-[var(--ins-text-gray)]">Define si el comando se muestra como disponible en el sistema.</p>
							</div>
							<button
								type="button"
								onClick={() => patchForm("active", !form.active)}
								className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${
									form.active ? "bg-[var(--secondary-color)] shadow-[0_0_10px_var(--secondary-color)]" : "bg-[var(--black-color)]/50"
								}`}
							>
								<span
									className={`inline-block h-5 w-5 transform rounded-full bg-[var(--white-color)] transition-transform duration-300 shadow-sm ${
										form.active ? "translate-x-6" : "translate-x-1 opacity-70"
									}`}
								/>
							</button>
						</div>

						<div>
							<div className="mb-3">
								<p className="text-sm font-bold text-[var(--ins-text-white)]">Permisos habilitados</p>
								<p className="text-xs text-[var(--ins-text-gray)]">El comando se mostrará si el jugador tiene al menos uno de estos permisos.</p>
							</div>

							<div className="space-y-3">
								{filteredPermissions.map((permission) => {
									const enabled = form.permissions.includes(permission.key);
									return (
										<div
											key={permission.id || permission.key}
											className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
												enabled
													? "bg-[var(--secondary-color)]/5 border-[var(--secondary-color)]/30"
													: "bg-[var(--white-color)]/5 border-[var(--white-color)]/5 hover:border-[var(--white-color)]/10 hover:bg-[var(--white-color)]/10"
											}`}
										>
											<div className="pr-4">
												<h4 className={`text-sm font-bold transition-colors ${enabled ? "text-[var(--ins-text-white)]" : "text-[var(--ins-text-gray)] group-hover:text-[var(--ins-text-white)]"}`}>
													{permission.name || permission.key}
												</h4>
												<p className="text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded bg-[var(--black-color)]/30 inline-block text-[var(--ins-text-gray)]">
													{permission.key}
												</p>
												{permission.description && (
													<p className="text-xs text-[var(--ins-text-gray)] mt-2 leading-relaxed">
														{permission.description}
													</p>
												)}
											</div>

											<button
												onClick={() => togglePermission(permission.key)}
												className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${
													enabled ? "bg-[var(--secondary-color)] shadow-[0_0_10px_var(--secondary-color)]" : "bg-[var(--black-color)]/50"
												}`}
												type="button"
											>
												<span
													className={`inline-block h-5 w-5 transform rounded-full bg-[var(--white-color)] transition-transform duration-300 shadow-sm ${
														enabled ? "translate-x-6" : "translate-x-1 opacity-70"
													}`}
												/>
											</button>
										</div>
									);
								})}

								{filteredPermissions.length === 0 ? (
									<div className="py-6 text-center text-sm text-[var(--ins-text-gray)]">No hay permisos disponibles.</div>
								) : null}
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6 flex items-center justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
					<Button
						type="button"
						variant="primary"
						className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
						onClick={() => onSave(form)}
						disabled={isSaving}
					>
						<Save size={16} /> Guardar
					</Button>
				</div>
			</div>
		</div>
	);
}

export default CommandsManager;
