import { X } from "lucide-react";
import { createPortal } from "react-dom";
import Button from "../../elements/Button";
import Select from "../../elements/Select";

function NewsEditorModal({
  mode,
  formData,
  setFormData,
  image,
  imagePreview,
  imageInputRef,
  onImageChange,
  onClose,
  onSubmit,
  onSave,
  submitting,
  typeOptions,
}) {
  const isEdit = mode === "edit";
  const update = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  return createPortal((
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={isEdit ? (event) => { event.preventDefault(); onSave(); } : onSubmit}
        className="relative z-10 grid h-[min(720px,calc(100dvh-3rem))] max-h-[720px] w-full max-w-[1600px] grid-cols-1 overflow-hidden rounded-3xl modal-main md:w-[88vw] md:grid-cols-12 md:grid-rows-[minmax(0,1fr)_auto]"
      >
        <div className="relative h-52 w-full cursor-pointer overflow-hidden md:col-span-4 md:row-span-2 md:h-full" onClick={() => imageInputRef.current?.click()}>
          <img src={imagePreview || image} alt="Vista previa de noticia" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-sm font-bold uppercase tracking-wider text-white/90">Click para subir imagen</div>
          <button type="button" onClick={(event) => { event.stopPropagation(); onClose(); }} className="absolute right-4 top-4 rounded-full bg-black/45 p-2 text-white transition-colors hover:bg-black/65" aria-label="Cerrar editor">
            <X size={18} />
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        </div>

        <div className="flex min-h-0 flex-col overflow-y-auto p-5 tdt-scrollbar md:col-span-8 md:row-span-1 md:p-7">
          <div className="mb-5">
            <label htmlFor={`${mode}-news-title`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--ins-text-gray)]">Título</label>
            <input id={`${mode}-news-title`} type="text" value={formData.title} onChange={(event) => update("title", event.target.value)} placeholder="Título de la noticia" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-lg font-bold text-[var(--ins-text-white)] outline-none transition-colors placeholder:text-white/35 focus:border-[var(--secondary-color)]" />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={`${mode}-news-type`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--ins-text-gray)]">Tipo</label>
              <Select id={`${mode}-news-type`} value={formData.type} onChange={(value) => update("type", value)} options={typeOptions} className="w-full" placeholder={typeOptions.length ? "Seleccionar" : "Sin tipos disponibles"} />
            </div>
            <div>
              <label htmlFor={`${mode}-news-date`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--ins-text-gray)]">Fecha</label>
              <input id={`${mode}-news-date`} type="date" value={formData.fecha} onChange={(event) => update("fecha", event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)]" />
            </div>
          </div>

          <div className="flex min-h-[190px] flex-1 flex-col">
            <label htmlFor={`${mode}-news-description`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--ins-text-gray)]">Descripción</label>
            <textarea id={`${mode}-news-description`} rows={8} value={formData.description} onChange={(event) => update("description", event.target.value)} placeholder="Contenido principal de la noticia" className="min-h-0 w-full flex-1 resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-lg leading-relaxed text-[var(--ins-text-white)] outline-none placeholder:text-white/45 focus:border-[var(--secondary-color)]" style={{ fontFamily: '"Times New Roman", Times, serif' }} />
          </div>

          <div className="mt-5">
            <label htmlFor={`${mode}-news-note`} className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[var(--ins-text-gray)]">Nota</label>
            <textarea id={`${mode}-news-note`} rows={2} value={formData.note} onChange={(event) => update("note", event.target.value)} placeholder="Dato extra opcional" className="w-full resize-none border-b border-white/25 bg-transparent text-base leading-relaxed text-[var(--ins-text-gray)] outline-none placeholder:text-white/35 focus:border-[var(--secondary-color)]" style={{ fontFamily: '"Times New Roman", Times, serif' }} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4 md:col-span-8 md:row-span-1 md:px-7">
          <Button type="button" variant="ghost" className="text-white" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button type="submit" variant="primary" className="bg-[var(--secondary-color)] text-white hover:bg-[var(--hover-secondary)]" disabled={submitting || typeOptions.length === 0}>{isEdit ? "Guardar cambios" : "Publicar"}</Button>
        </div>
      </form>
    </div>
  ), document.body);
}

export default NewsEditorModal;
