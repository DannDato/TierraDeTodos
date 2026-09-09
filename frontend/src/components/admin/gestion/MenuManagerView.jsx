import { useEffect, useMemo, useState } from "react";
import { Menu as MenuIcon, MoreVertical, Plus, Save, Search, X } from "lucide-react";
import api from "../../../api/axios";
import AlertModal from "../../../elements/AlertModal";
import Button from "../../../elements/Button";
import CloseButton from "../../../elements/closeButton";
import Input from "../../../elements/Input";
import LoadingOverlay from "../../shared/LoadingOverlay";
import Select from "../../../elements/Select";

const initialItem = { id: null, key: "", name: "", icon: "Home", path: "/", target: "_self", shortAccess: false, orderIndex: 0, basic: "FALSE", menuGroup: "user", required_permissions: [], active: true };
const yesNo = [{ value: "false", label: "No" }, { value: "true", label: "Sí" }];
const targets = [{ value: "_self", label: "Esta ventana" }, { value: "_blank", label: "Nueva ventana" }];
const groups = [{ value: "user", label: "Usuario" }, { value: "admin", label: "Administrador" }];

function MenuManagerView() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ isOpen: false, type: "info", title: "Aviso", message: "" });

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/system/menu/admin");
      setItems(Array.isArray(data?.menuItems) ? data.menuItems : []);
    } catch (error) {
      setAlert({ isOpen: true, type: "error", title: "No se pudo cargar", message: error.response?.data?.message || "No se pudo cargar el menú." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadItems(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => [item.key, item.name, item.path, item.menuGroup].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [items, search]);

  const save = async (form) => {
    const payload = {
      key: form.key.trim(), name: form.name.trim(), icon: form.icon.trim(), path: form.path.trim(), target: form.target,
      shortAccess: Boolean(form.shortAccess), orderIndex: Number(form.orderIndex), basic: form.basic, menuGroup: form.menuGroup,
      required_permissions: Array.isArray(form.required_permissions) ? form.required_permissions : String(form.required_permissions || "").split(",").map((item) => item.trim()).filter(Boolean), active: Boolean(form.active),
    };
    try {
      setSaving(true);
      if (form.id) await api.put(`/system/menu/admin/${form.id}`, payload);
      else await api.post("/system/menu/admin", payload);
      await loadItems();
      setSelected(null);
      setAlert({ isOpen: true, type: "success", title: "Guardado", message: "Elemento de menú guardado correctamente." });
    } catch (error) {
      setAlert({ isOpen: true, type: "error", title: "No se pudo guardar", message: error.response?.data?.message || "No se pudo guardar el elemento." });
    } finally { setSaving(false); }
  };

  const deactivate = async (item) => {
    try {
      setSaving(true);
      await api.delete(`/system/menu/admin/${item.id}`);
      await loadItems();
      setSelected(null);
    } catch (error) {
      setAlert({ isOpen: true, type: "error", title: "No se pudo desactivar", message: error.response?.data?.message || "No se pudo desactivar el elemento." });
    } finally { setSaving(false); }
  };

  return (
    <div className="flex h-full flex-col animate-[fadeIn_0.2s_ease-out]">
      <LoadingOverlay isVisible={loading || saving} />
      <AlertModal isOpen={alert.isOpen} type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert((current) => ({ ...current, isOpen: false }))} />
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><h2 className="flex items-center gap-2 text-2xl font-extrabold text-[var(--ins-text-white)]"><MenuIcon size={22} className="text-[var(--secondary-color)]" /> Menú</h2><p className="mt-1 text-sm text-[var(--ins-text-gray)]">Administra las opciones visibles y sus permisos de acceso.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar menú..." className="w-full rounded-xl border border-white/10 bg-[var(--black-color)]/30 px-4 py-2.5 pr-10 text-sm text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)] sm:w-64" />{search ? <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)]"><X size={14} /></button> : <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)]" />}</div><Button variant="primary" onClick={() => setSelected({ ...initialItem })}><Plus size={17} /> Nuevo</Button></div>
      </div>
      {!filtered.length ? <div className="rounded-3xl border border-white/5 bg-black/20 py-12 text-center text-sm text-[var(--ins-text-gray)]">No hay elementos de menú para mostrar.</div> : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{filtered.map((item) => <MenuItem key={item.id} item={item} onEdit={setSelected} onDeactivate={deactivate} />)}</div>}
      {selected && <MenuEditor item={selected} onClose={() => setSelected(null)} onSave={save} onDeactivate={deactivate} saving={saving} />}
    </div>
  );
}

function MenuItem({ item, onEdit }) {
  return <article className="relative rounded-2xl border border-white/10 bg-black/10 p-4"><div className="flex items-start gap-3"><div className="rounded-xl bg-white/10 p-3 text-[var(--secondary-color)]"><MenuIcon size={20} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-[var(--ins-text-white)]">{item.name}</h3><p className="mt-1 text-xs text-[var(--ins-text-gray)]">{item.key} · {item.path}</p></div><button type="button" onClick={() => onEdit(item)} className="rounded-lg p-2 text-[var(--ins-text-gray)] hover:bg-white/10 hover:text-white" aria-label={`Editar ${item.name}`}><MoreVertical size={18} /></button></div><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded-full bg-white/10 px-2 py-1 text-[var(--ins-text-gray)]">{item.menuGroup}</span><span className={`rounded-full px-2 py-1 ${item.active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{item.active ? "Activo" : "Inactivo"}</span>{item.shortAccess && <span className="rounded-full bg-sky-500/15 px-2 py-1 text-sky-300">Acceso corto</span>}</div></div></div></article>;
}

function MenuEditor({ item, onClose, onSave, onDeactivate, saving }) {
  const [form, setForm] = useState({ ...initialItem, ...item, required_permissions: Array.isArray(item.required_permissions) ? item.required_permissions : [] });
  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  return <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm sm:p-5"><div className="relative flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-3xl border border-white/10 bg-[var(--ins-background)]/95 shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div><h3 className="text-xl font-bold text-[var(--ins-text-white)]">{form.id ? "Editar elemento de menú" : "Nuevo elemento de menú"}</h3><p className="mt-1 text-sm text-[var(--ins-text-gray)]">Configura ruta, visibilidad y permisos.</p></div><CloseButton onClick={onClose} /></div><div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-6 tdt-scrollbar md:grid-cols-2"><Input label="Key" value={form.key} onChange={(event) => patch("key", event.target.value)} placeholder="menu.example" /><Input label="Nombre" value={form.name} onChange={(event) => patch("name", event.target.value)} placeholder="Ejemplo" /><Input label="Icono Lucide" value={form.icon} onChange={(event) => patch("icon", event.target.value)} placeholder="Home" /><Input label="Ruta" value={form.path} onChange={(event) => patch("path", event.target.value)} placeholder="/example" /><Select label="Destino" value={form.target} onChange={(value) => patch("target", value)} options={targets} /><Select label="Grupo" value={form.menuGroup} onChange={(value) => patch("menuGroup", value)} options={groups} /><Input label="Orden" type="number" value={form.orderIndex} onChange={(event) => patch("orderIndex", Number(event.target.value || 0))} min="0" /><Input label="Permisos requeridos" value={form.required_permissions.join(", ")} onChange={(event) => patch("required_permissions", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} placeholder="menu.example, admin.view" /><Select label="Acceso corto" value={String(Boolean(form.shortAccess))} onChange={(value) => patch("shortAccess", value === "true")} options={yesNo} /><Select label="Básico" value={form.basic === "TRUE" ? "true" : "false"} onChange={(value) => patch("basic", value === "true" ? "TRUE" : "FALSE")} options={yesNo} /><Select label="Activo" value={String(Boolean(form.active))} onChange={(value) => patch("active", value === "true")} options={yesNo} /></div><div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-5">{form.id && form.active ? <Button variant="cancel" onClick={() => onDeactivate(form)} disabled={saving}>Desactivar</Button> : <div />}{<div className="flex gap-2"><Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button><Button variant="primary" onClick={() => onSave(form)} disabled={saving}><Save size={16} /> Guardar</Button></div>}</div></div></div>;
}

export default MenuManagerView;
