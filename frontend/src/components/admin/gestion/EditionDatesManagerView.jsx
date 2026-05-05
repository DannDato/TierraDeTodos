import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Download, Plus, Save } from "lucide-react";

import Button from "../../../elements/Button";
import Input from "../../../elements/Input";
import Table from "../../../elements/Table";
import api from "../../../api/axios";

const createEmptyForm = () => ({
  id: null,
  date: "",
  name: "",
  description: "",
  emoji: "",
  color: "#9ca3af",
});

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export default function EditionDatesManagerView({ editionId, openAlert }) {
  const [dates, setDates] = useState([]);
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
      setDates(data?.dates || []);
      setPreviousEdition(data?.previousEdition || null);
    } catch (error) {
      console.error("Error cargando fechas de edición:", error);
      setDates([]);
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
      date: toInputDate(row.date),
      name: row.name || "",
      description: row.description || "",
      emoji: row.emoji || "",
      color: row.color || "#9ca3af",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData(createEmptyForm());
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formData.date || !String(formData.name || "").trim()) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Fecha y nombre son obligatorios.",
      });
      return;
    }

    try {
      setProcessing(true);
      const payload = {
        date: formData.date,
        name: String(formData.name || "").trim(),
        description: String(formData.description || "").trim(),
        emoji: String(formData.emoji || "").trim(),
        color: formData.color || "#9ca3af",
      };

      if (formData.id) {
        await api.put(`/admin/editions/${editionId}/dates/${formData.id}`, payload);
      } else {
        await api.post(`/admin/editions/${editionId}/dates`, payload);
      }

      await loadResources();
      handleCancel();
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar la fecha.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = (row) => {
    openAlert({
      type: "warning",
      title: "Eliminar fecha",
      message: `Se eliminará la fecha ${row.name}.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          setProcessing(true);
          await api.delete(`/admin/editions/${editionId}/dates/${row.id}`);
          await loadResources();
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo eliminar",
            message: error.response?.data?.message || "No se pudo eliminar la fecha.",
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
      title: "Importar fechas",
      message: previousEdition
        ? `Se copiarán las fechas desde la edición anterior: ${previousEdition.name}.`
        : "No hay una edición anterior disponible para importar.",
      confirmText: "Importar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          setProcessing(true);
          const { data } = await api.post(`/admin/editions/${editionId}/dates/import-previous`);
          await loadResources();
          openAlert({
            type: "success",
            title: "Fechas importadas",
            message: `Se importaron ${data?.importedCount || 0} fechas.`,
          });
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo importar",
            message: error.response?.data?.message || "No se pudieron importar las fechas.",
          });
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const datesColumns = useMemo(() => ([
    {
      key: "date",
      header: "Fecha",
      cellClassName: "text-[var(--ins-text-white)]",
      render: (row) => toDisplayDate(row.date),
    },
    {
      key: "name",
      header: "Nombre",
      cellClassName: "text-[var(--ins-text-white)] font-semibold",
      render: (row) => row.name,
    },
    {
      key: "description",
      header: "Descripción",
      cellClassName: "text-[var(--ins-text-gray)]",
      render: (row) => row.description || "Sin descripción",
    },
    {
      key: "emoji",
      header: "Emoji",
      cellClassName: "text-2xl",
      render: (row) => row.emoji || "-",
    },
    {
      key: "color",
      header: "Color",
      render: (row) => (
        <span className="inline-flex items-center gap-2 text-sm text-[var(--ins-text-white)]">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }}></span>
          {row.color}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="primary" className="bg-white/10 hover:bg-white/15 text-white" onClick={() => handleEdit(row)} disabled={processing}>Editar</Button>
          <Button variant="cancel" className="text-[var(--danger-color)] border border-[var(--danger-color)]/30 hover:bg-[var(--danger-color)]/10" onClick={() => handleDelete(row)} disabled={processing}>Eliminar</Button>
        </div>
      ),
    },
  ]), [processing]);

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h4 className="text-xl font-extrabold text-[var(--ins-text-white)]">Fechas de la Edición</h4>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">Crea hitos del timeline y ordénalos por fecha.</p>
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
            <Plus size={16} /> Nueva fecha
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[var(--white-color)]/10 bg-black/20 p-5 grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-2">
            <Input label="Fecha" type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} />
          </div>
          <div className="xl:col-span-3">
            <Input label="Nombre" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Ej. Apertura del Nether" />
          </div>
          <div className="xl:col-span-4">
            <Input label="Descripción" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Describe el evento..." />
          </div>
          <div className="xl:col-span-1">
            <Input label="Emoji" value={formData.emoji} onChange={(e) => handleChange("emoji", e.target.value)} placeholder="🔥" />
          </div>
          <div className="xl:col-span-2 flex gap-3 items-end">
            <div className="flex-1">
              <Input label="Color" value={formData.color} onChange={(e) => handleChange("color", e.target.value)} placeholder="#9ca3af" />
            </div>
            <label className="relative w-10 h-10 rounded-xl border-2 border-[var(--black-color)]/40 cursor-pointer block overflow-hidden transition-transform hover:scale-105 mb-0.5" style={{ backgroundColor: formData.color }}>
              <input type="color" value={formData.color} onChange={(e) => handleChange("color", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </label>
          </div>
          <div className="xl:col-span-12 flex justify-end gap-3 pt-2">
            <Button variant="primary" className="bg-white/10 hover:bg-white/15 text-white" onClick={handleCancel} disabled={processing}>Cancelar</Button>
            <Button variant="primary" className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2" onClick={handleSave} disabled={processing}><Save size={16} /> Guardar fecha</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto tdt-scrollbar rounded-2xl border border-[var(--white-color)]/8 bg-black/10">
        {loading ? (
          <div className="py-10 text-center text-[var(--ins-text-gray)]">Cargando fechas...</div>
        ) : (
          <Table
            columns={datesColumns}
            data={dates}
            rowKey="id"
            minWidth="min-w-[980px]"
            emptyColSpan={6}
            emptyMessage="No hay fechas registradas."
            layout="embedded"
          />
        )}
      </div>
    </div>
  );
}