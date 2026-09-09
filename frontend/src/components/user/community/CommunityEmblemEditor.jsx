import React, { useCallback, useEffect, useRef, useState } from "react";
import { Brush, Eraser, Undo2, Redo2, Trash2 } from "lucide-react";

const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 1088;
const MAX_HISTORY = 30;

export default function CommunityEmblemEditor({ initialImage = "", onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const [tool, setTool] = useState("brush");
  const [brushColor, setBrushColor] = useState("#d6b35f");
  const [brushSize, setBrushSize] = useState(18);
  const [opacity, setOpacity] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [imageError, setImageError] = useState(false);

  const updateHistoryButtons = () => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current >= 0 && historyIndexRef.current < historyRef.current.length - 1);
  };

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      }

      historyRef.current.push(imageData);

      if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();

      historyIndexRef.current = historyRef.current.length - 1;
      updateHistoryButtons();
    } catch (_error) {
      setImageError(true);
    }
  }, []);

  const emitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const previewUrl = canvas.toDataURL("image/png");

      canvas.toBlob((blob) => {
        if (!blob) return;

        const file = new File([blob], "community-emblem.png", { type: "image/png" });
        onChange?.(file, previewUrl);
      }, "image/png");
    } catch (_error) {
      setImageError(true);
    }
  }, [onChange]);

  const clearCanvasOnly = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    historyRef.current = [];
    historyIndexRef.current = -1;
    setImageError(false);

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!initialImage) {
      saveSnapshot();
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const ratio = Math.min(CANVAS_WIDTH / image.width, CANVAS_HEIGHT / image.height);
      const width = image.width * ratio;
      const height = image.height * ratio;
      const x = (CANVAS_WIDTH - width) / 2;
      const y = (CANVAS_HEIGHT - height) / 2;

      ctx.drawImage(image, x, y, width, height);
      saveSnapshot();
    };

    image.onerror = () => {
      clearCanvasOnly();
      saveSnapshot();
      setImageError(true);
    };

    image.src = initialImage;
  }, [initialImage, clearCanvasOnly, saveSnapshot]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const configureContext = () => {
    const ctx = canvasRef.current.getContext("2d");

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = opacity;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
    }

    return ctx;
  };

  const drawDot = (point) => {
    const ctx = configureContext();

    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const point = getPoint(event);

    drawingRef.current = true;
    lastPointRef.current = point;

    drawDot(point);
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current) return;

    event.preventDefault();

    const point = getPoint(event);
    const lastPoint = lastPointRef.current;
    const ctx = configureContext();

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    lastPointRef.current = point;
  };

  const handlePointerUp = (event) => {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    lastPointRef.current = null;

    event.currentTarget.releasePointerCapture?.(event.pointerId);

    saveSnapshot();
    emitCanvas();
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;

    historyIndexRef.current--;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = historyRef.current[historyIndexRef.current];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(snapshot, 0, 0);

    updateHistoryButtons();
    emitCanvas();
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current++;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = historyRef.current[historyIndexRef.current];

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(snapshot, 0, 0);

    updateHistoryButtons();
    emitCanvas();
  };

  const handleClear = () => {
    clearCanvasOnly();
    saveSnapshot();
    emitCanvas();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/10 bg-black/15">
        <button type="button" onClick={() => setTool("brush")} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${tool === "brush" ? "bg-[var(--secondary-color)] text-black" : "bg-white/5 text-[var(--ins-text-gray)] hover:text-white"}`}>
          <Brush size={15} /> Pincel
        </button>

        <button type="button" onClick={() => setTool("eraser")} className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${tool === "eraser" ? "bg-[var(--secondary-color)] text-black" : "bg-white/5 text-[var(--ins-text-gray)] hover:text-white"}`}>
          <Eraser size={15} /> Borrador
        </button>

        <div className="w-px h-7 bg-white/10 mx-1" />

        <button type="button" onClick={handleUndo} disabled={!canUndo} className="p-2 rounded-xl bg-white/5 text-[var(--ins-text-gray)] hover:text-white disabled:opacity-25 disabled:pointer-events-none" title="Deshacer">
          <Undo2 size={16} />
        </button>

        <button type="button" onClick={handleRedo} disabled={!canRedo} className="p-2 rounded-xl bg-white/5 text-[var(--ins-text-gray)] hover:text-white disabled:opacity-25 disabled:pointer-events-none" title="Rehacer">
          <Redo2 size={16} />
        </button>

        <button type="button" onClick={handleClear} className="p-2 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 ml-auto" title="Limpiar lienzo">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-b border-white/10">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--ins-text-gray)]">Color del pincel</label>

          <div className="flex items-center gap-2">
            <input type="text" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white outline-none focus:border-white/30" />

            <label className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-white/10 cursor-pointer" style={{ backgroundColor: brushColor }}>
              <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--ins-text-gray)]">Tamaño</label>
            <span className="text-[10px] font-mono text-white/60">{brushSize}px</span>
          </div>

          <input type="range" min="2" max="80" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-[var(--secondary-color)]" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-[0.16em] font-bold text-[var(--ins-text-gray)]">Opacidad</label>
            <span className="text-[10px] font-mono text-white/60">{Math.round(opacity * 100)}%</span>
          </div>

          <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-[var(--secondary-color)]" />
        </div>
      </div>

      <div className="p-4">
        <div className="relative mx-auto w-full max-w-[360px] aspect-[9/17] overflow-hidden rounded-2xl border border-white/10 shadow-inner" style={{ backgroundColor: "#d8d8d8", backgroundImage: "linear-gradient(45deg,#aaa 25%,transparent 25%),linear-gradient(-45deg,#aaa 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#aaa 75%),linear-gradient(-45deg,transparent 75%,#aaa 75%)", backgroundSize: "24px 24px", backgroundPosition: "0 0,0 12px,12px -12px,-12px 0px" }}>
          <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} className={`absolute inset-0 w-full h-full touch-none ${tool === "eraser" ? "cursor-cell" : "cursor-crosshair"}`} />
        </div>

        <div className="flex items-center justify-between mt-3 gap-3">
          <p className="text-[10px] leading-relaxed text-[var(--ins-text-gray)]">
            El fondo cuadriculado representa transparencia. Sólo se guardará lo que dibujes.
          </p>

          <span className="shrink-0 text-[9px] font-mono uppercase tracking-[0.15em] text-white/30">
            576 × 1088 PNG
          </span>
        </div>

        {imageError && (
          <div className="mt-3 px-3 py-2 rounded-xl border border-amber-400/20 bg-amber-500/10 text-xs text-amber-200">
            No pude cargar el emblema existente en el canvas. Si viene de R2, revisa CORS para permitir el origen del frontend.
          </div>
        )}
      </div>
    </div>
  );
}