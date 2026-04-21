import { useEffect, useState } from "react";
import { BookOpen, Download, Plus, Save } from "lucide-react";

import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import api from "../../api/axios";

const RULE_CATEGORY_OPTIONS = [
  { value: "PRINCIPAL", label: "Principal" },
  { value: "OBLIGACION", label: "Obligación" },
  { value: "TECNICO", label: "Técnico" },
  { value: "STAFF", label: "Staff" },
];

const createEmptyForm = () => ({
  id: null,
  category: "PRINCIPAL",
  item: "",
  icon: "",
  color: "#f87171",
  sortOrder: 10,
});

export default function EditionRulesManagerView({ editionId, openAlert }) {
  const [rules, setRules] = useState([]);
  const [previousEdition, setPreviousEdition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(createEmptyForm());

  useEffect(() => {
    if (!editionId) return;
    loadResources();
  }, [editionId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/editions/${editionId}/resources`);
      setRules(data?.rules || []);
      setPreviousEdition(data?.previousEdition || null);
    } catch (error) {
      console.error("Error cargando reglas de edición:", error);
      setRules([]);
      setPreviousEdition(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = () => {
    setFormData(createEmptyForm());
    setShowForm(true);
  };

  const handleEdit = (row) => {
    setFormData({
      id: row.id,
      category: row.category || "PRINCIPAL",
      item: row.item || "",
      icon: row.icon || "",
      color: row.color || "#f87171",
      sortOrder: row.sortOrder ?? 10,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData(createEmptyForm());
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.category || !String(formData.item || "").trim()) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Categoría y regla son obligatorios.",
      });
      return;
    }

    try {
      setProcessing(true);
      const payload = {
        category: formData.category,
        item: String(formData.item || "").trim(),
        icon: String(formData.icon || "").trim(),
        color: formData.color || "#f87171",
        sortOrder: Number(formData.sortOrder || 0),
      };

      if (formData.id) {
        await api.put(`/admin/editions/${editionId}/rules/${formData.id}`, payload);
      } else {
        await api.post(`/admin/editions/${editionId}/rules`, payload);
      }

      await loadResources();
      handleCancel();
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar la regla.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = (row) => {
    openAlert({
      type: "warning",
      title: "Eliminar regla",
      message: "Se eliminará la regla seleccionada.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          setProcessing(true);
          await api.delete(`/admin/editions/${editionId}/rules/${row.id}`);
          await loadResources();
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo eliminar",
            message: error.response?.data?.message || "No se pudo eliminar la regla.",
          });
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleImport = () => {
    openAlert({
      type: "warning",
      title: "Importar reglas",
      message: previousEdition
        ? `Se copiarán las reglas desde la edición anterior: ${previousEdition.name}.`
        : "No hay una edición anterior disponible para importar.",
      confirmText: "Importar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          setProcessing(true);
          const { data } = await api.post(`/admin/editions/${editionId}/rules/import-previous`);
          await loadResources();
          openAlert({
            type: "success",
            title: "Reglas importadas",
            message: `Se importaron ${data?.importedCount || 0} reglas.`,
          });
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo importar",
            message: error.response?.data?.message || "No se pudieron importar las reglas.",
          });
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h4 className="text-xl font-extrabold text-[var(--ins-text-white)]">Reglas de la Edición</h4>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">Administra reglas en formato tabla y por categoría.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            className="bg-[var(--white-color)]/10 hover:bg-[var(--white-color)]/15 text-white flex items-center gap-2"
            onClick={handleImport}
            disabled={!previousEdition || processing}
          >
            <Download size={16} /> Importar edición anterior
          </Button>
          <Button
            variant="primary"
            className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
            onClick={handleCreate}
            disabled={processing}
          >
            <Plus size={16} /> Nueva regla
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[var(--white-color)]/10 bg-black/20 p-5 grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-2 flex flex-col gap-2">
            <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">Categoría</label>
            <Select value={formData.category} onChange={(value) => handleChange("category", value)} options={RULE_CATEGORY_OPTIONS} />
          </div>
          <div className="xl:col-span-5">
            <Input label="Regla" value={formData.item} onChange={(e) => handleChange("item", e.target.value)} placeholder="Describe la regla..." />
          </div>
          <div className="xl:col-span-1">
            <Input label="Icono" value={formData.icon} onChange={(e) => handleChange("icon", e.target.value)} placeholder="❌" />
          </div>
          <div className="xl:col-span-2 flex gap-3 items-end">
            <div className="flex-1">
              <Input label="Color" value={formData.color} onChange={(e) => handleChange("color", e.target.value)} placeholder="#f87171" />
            </div>
            <label className="relative w-10 h-10 rounded-xl border-2 border-[var(--black-color)]/40 cursor-pointer block overflow-hidden transition-transform hover:scale-105 mb-0.5" style={{ backgroundColor: formData.color }}>
              <input type="color" value={formData.color} onChange={(e) => handleChange("color", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
          </div>
          <div className="xl:col-span-2">
            <Input label="Orden" type="number" value={formData.sortOrder} onChange={(e) => handleChange("sortOrder", e.target.value)} placeholder="10" />
          </div>
          <div className="xl:col-span-12 flex justify-end gap-3 pt-2">
            <Button variant="primary" className="bg-white/10 hover:bg-white/15 text-white" onClick={handleCancel} disabled={processing}>Cancelar</Button>
            <Button variant="primary" className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2" onClick={handleSave} disabled={processing}><Save size={16} /> Guardar regla</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto tdt-scrollbar rounded-2xl border border-[var(--white-color)]/8 bg-black/10">
        {loading ? (
          <div className="py-10 text-center text-[var(--ins-text-gray)]">Cargando reglas...</div>
        ) : (
          <table className="w-full min-w-[1080px] text-left">
            <thead>
              <tr className="bg-black/20 text-sm text-[var(--ins-text-gray)]">
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Categoría</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Regla</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Icono</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Color</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Orden</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--ins-text-gray)]">No hay reglas registradas.</td>
                </tr>
              ) : rules.map((row) => (
                <tr key={row.id} className="border-t border-black/10 hover:bg-black/5 transition-colors">
                  <td className="py-4 px-4 text-[var(--ins-text-white)]">{RULE_CATEGORY_OPTIONS.find((option) => option.value === row.category)?.label || row.category}</td>
                  <td className="py-4 px-4 text-[var(--ins-text-white)] font-semibold">{row.item}</td>
                  <td className="py-4 px-4 text-2xl">{row.icon || "-"}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-2 text-sm text-[var(--ins-text-white)]">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }}></span>
                      {row.color}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[var(--ins-text-white)]">{row.sortOrder}</td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="primary" className="bg-white/10 hover:bg-white/15 text-white" onClick={() => handleEdit(row)} disabled={processing}>Editar</Button>
                      <Button variant="cancel" className="text-[var(--danger-color)] border border-[var(--danger-color)]/30 hover:bg-[var(--danger-color)]/10" onClick={() => handleDelete(row)} disabled={processing}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}