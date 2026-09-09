import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import api from "../../api/axios";
import Button from "../../elements/Button";
import Input from "../../elements/Input";

function ProfileInformation() {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  useEffect(() => {
    const loadInformation = async () => {
      try {
        const { data } = await api.get("/user/profile/information");
        const loadedFields = data?.fields || [];
        setFields(loadedFields);
        setValues(Object.fromEntries(loadedFields.map((field) => [field.key, field.value ?? (field.dataType === "boolean" ? false : "")] )));
      } catch (error) {
        setNotice({ type: "error", message: error.response?.data?.message || "No se pudo cargar la información adicional." });
      } finally {
        setLoading(false);
      }
    };
    loadInformation();
  }, []);

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setNotice({ type: "", message: "" });
  };

  const saveInformation = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const { data } = await api.put("/user/profile/information", { values });
      const savedFields = data?.fields || fields;
      setFields(savedFields);
      setValues(Object.fromEntries(savedFields.map((field) => [field.key, field.value ?? (field.dataType === "boolean" ? false : "")] )));
      setNotice({ type: "success", message: "Información adicional guardada correctamente." });
    } catch (error) {
      setNotice({ type: "error", message: error.response?.data?.message || "No se pudo guardar la información adicional." });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field) => {
    const value = values[field.key] ?? (field.dataType === "boolean" ? false : "");
    const commonProps = {
      id: `profile-information-${field.key}`,
      name: field.key,
      value: field.dataType === "boolean" ? undefined : value,
      onChange: (event) => updateValue(field.key, event.target.value),
      maxLength: field.maxLength || undefined,
      required: field.required,
    };

    if (field.dataType === "textarea") {
      return <textarea {...commonProps} value={value} rows={4} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)]" />;
    }
    if (field.dataType === "select") {
      return (
        <select {...commonProps} className="w-full rounded-lg border border-white/10 bg-[var(--ins-background)] px-4 py-3 text-sm text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)]">
          <option value="">Selecciona una opción</option>
          {(field.options?.choices || []).map((choice) => <option key={choice} value={choice}>{choice}</option>)}
        </select>
      );
    }
    if (field.dataType === "boolean") {
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateValue(field.key, event.target.checked)} />
          <span>{field.label}</span>
        </label>
      );
    }
    return <Input {...commonProps} type={field.dataType === "url" || field.dataType === "email" || field.dataType === "number" || field.dataType === "date" ? field.dataType : "text"} />;
  };

  if (loading) return <p className="text-sm text-[var(--ins-text-gray)]">Cargando información adicional...</p>;
  if (!fields.length) return null;

  return (
    <form className="space-y-5" onSubmit={saveInformation}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.dataType === "textarea" ? "md:col-span-2" : ""}>
            {field.dataType !== "boolean" && <label htmlFor={`profile-information-${field.key}`} className="mb-1 block text-sm font-medium">{field.label}</label>}
            {field.description && <p className="mb-2 text-xs text-[var(--ins-text-gray)]">{field.description}</p>}
            {renderField(field)}
          </div>
        ))}
      </div>
      {notice.message && <p className={`text-sm font-semibold ${notice.type === "error" ? "text-[var(--danger-color)]" : "text-emerald-400"}`}>{notice.message}</p>}
      <Button type="submit" variant="primary" size="sm" disabled={saving} className="flex items-center gap-2">
        <Save size={16} /> {saving ? "Guardando..." : "Guardar información"}
      </Button>
    </form>
  );
}

export default ProfileInformation;
