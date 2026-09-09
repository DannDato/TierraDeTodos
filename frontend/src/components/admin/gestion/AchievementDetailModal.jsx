import { useState } from "react";
import { createPortal } from "react-dom";
import { Save, Trash2 } from "lucide-react";
import Button from "../../../elements/Button";
import CloseButton from "../../../elements/closeButton";
import Input from "../../../elements/Input";
import Select from "../../../elements/Select";
import Textarea from "../../../elements/Textarea";

const typeOptions = [{ value: "STAT", label: "Estadística" }, { value: "CUSTOM", label: "Personalizado" }];
const rarityOptions = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"].map((value) => ({ value, label: value }));
const operatorOptions = [{ value: "GTE", label: "Mayor o igual" }, { value: "LTE", label: "Menor o igual" }, { value: "EQ", label: "Igual" }];
const yesNoOptions = [{ value: "false", label: "No" }, { value: "true", label: "Si" }];

function AchievementDetailModal({ item, stats, emblems, onClose, onSave, onDelete, isSaving }) {
  const [form, setForm] = useState({
    key: "", name: "", description: "", hint: "", type: "STAT", rarity: "COMMON", goal: 1, operator: "GTE", statDefinitionId: "", isSecret: false, isActive: true, isRepeatable: false, points: 0, icon: "", sortOrder: 0, prizeEmblemId: "", ...item,
  });

  const patch = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const statOptions = stats.map((stat) => ({ value: String(stat.id), label: `${stat.name} (${stat.key})` }));
  const emblemOptions = [{ value: "", label: "Sin premio" }, ...emblems.map((emblem) => ({ value: String(emblem.id), label: `${emblem.name} (${emblem.rarity})` }))];

  return createPortal((
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[min(760px,calc(100dvh-2rem))] max-h-[760px] w-full max-w-[1400px] flex-col rounded-3xl border border-white/10 bg-[var(--ins-background)]/95 shadow-2xl md:w-[88vw]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div><h3 className="text-xl font-bold text-[var(--ins-text-white)]">{form.id ? "Editar Achievement" : "Nuevo Achievement"}</h3><p className="mt-1 text-sm text-[var(--ins-text-gray)]">Configura condición, visibilidad y recompensa.</p></div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-6 tdt-scrollbar md:grid-cols-2">
          <Input label="Key" value={form.key} onChange={(event) => patch("key", event.target.value.toUpperCase())} placeholder="CONNECT_3_ACCOUNTS" maxLength={100} />
          <Input label="Nombre" value={form.name} onChange={(event) => patch("name", event.target.value)} placeholder="Conexiones múltiples" />
          <div className="md:col-span-2"><Textarea label="Descripción" value={form.description} onChange={(event) => patch("description", event.target.value)} rows={3} placeholder="Descripción del achievement" /></div>
          <Input label="Pista" value={form.hint} onChange={(event) => patch("hint", event.target.value)} placeholder="Cómo conseguirlo" />
          <Input label="Icono (URL)" value={form.icon} onChange={(event) => patch("icon", event.target.value)} placeholder="https://..." />
          <Select label="Tipo" value={form.type} onChange={(value) => patch("type", value)} options={typeOptions} />
          <Select label="Rareza" value={form.rarity} onChange={(value) => patch("rarity", value)} options={rarityOptions} />
          {form.type === "STAT" && <><Select label="Estadística" value={String(form.statDefinitionId || "")} onChange={(value) => patch("statDefinitionId", Number(value))} options={statOptions} /><Select label="Operador" value={form.operator} onChange={(value) => patch("operator", value)} options={operatorOptions} /></>}
          <Input label="Meta" type="number" value={form.goal} onChange={(event) => patch("goal", Number(event.target.value || 0))} min="0" />
          <Input label="Puntos" type="number" value={form.points} onChange={(event) => patch("points", Number(event.target.value || 0))} min="0" />
          <Select label="Emblema premio" value={String(form.prizeEmblemId || "")} onChange={(value) => patch("prizeEmblemId", Number(value) || null)} options={emblemOptions} />
          <Input label="Orden" type="number" value={form.sortOrder} onChange={(event) => patch("sortOrder", Number(event.target.value || 0))} min="0" />
          <Select label="Activo" value={String(Boolean(form.isActive))} onChange={(value) => patch("isActive", value === "true")} options={yesNoOptions} />
          <Select label="Secreto" value={String(Boolean(form.isSecret))} onChange={(value) => patch("isSecret", value === "true")} options={yesNoOptions} />
          <Select label="Repetible" value={String(Boolean(form.isRepeatable))} onChange={(value) => patch("isRepeatable", value === "true")} options={yesNoOptions} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
          {form.id ? <Button type="button" variant="cancel" onClick={() => onDelete(form)} disabled={isSaving}><Trash2 size={16} /> Eliminar</Button> : <div />}
          <div className="flex gap-2"><Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button><Button type="button" variant="primary" onClick={() => onSave(form)} disabled={isSaving}><Save size={16} /> Guardar</Button></div>
        </div>
      </div>
    </div>
  ), document.body);
}

export default AchievementDetailModal;
