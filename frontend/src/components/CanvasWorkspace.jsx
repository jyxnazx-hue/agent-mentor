import React, { useRef, useState, useEffect } from "react";
import { 
  Edit3, Highlighter, Lasso, Square, Type, 
  Grid, MousePointer, Undo2, Redo2, Trash2, Eraser
} from "lucide-react";

export default function CanvasWorkspace({ 
  highlightBoxes, 
  onLassoSelect, 
  registerGetBlob, 
  registerAiWriter 
}) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen"); // 'pen' | 'highlighter' | 'eraser' | 'lasso' | 'pointer' | 'rect' | 'text'
  const [isDrawing, setIsDrawing] = useState(false);
  const [lassoPoints, setLassoPoints] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  
  const historyRef = useRef([]);
  const redoRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();

    registerGetBlob(() => {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
      });
    });

    registerAiWriter((actions) => {
      executeAiDrawing(actions);
    });
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    historyRef.current.push(canvas.toDataURL());
    if (historyRef.current.length > 30) historyRef.current.shift();
    redoRef.current = [];
  };

  const handleUndo = () => {
    if (historyRef.current.length <= 1) return;
    const current = historyRef.current.pop();
    redoRef.current.push(current);
    const prev = historyRef.current[historyRef.current.length - 1];
    restoreCanvas(prev);
  };

  const handleRedo = () => {
    if (redoRef.current.length === 0) return;
    const next = redoRef.current.pop();
    historyRef.current.push(next);
    restoreCanvas(next);
  };

  const restoreCanvas = (dataUrl) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const executeAiDrawing = (steps) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    steps.forEach((step, index) => {
      setTimeout(() => {
        if (step.type === "text") {
          ctx.font = "14px monospace";
          ctx.fillStyle = "#0F172A";
          ctx.fillText(step.text, step.x || 80, step.y || 120 + index * 32);
        } else if (step.type === "line") {
          ctx.beginPath();
          ctx.moveTo(step.x1, step.y1);
          ctx.lineTo(step.x2, step.y2);
          ctx.strokeStyle = "#0F172A";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        saveHistory();
      }, index * 800);
    });
  };

  const startDrawing = (e) => {
    if (tool === "pointer") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    if (tool === "lasso") {
      setLassoPoints([{ x, y }]);
    } else {
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (tool === "eraser") {
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 20;
      } else if (tool === "highlighter") {
        ctx.strokeStyle = "rgba(226, 232, 240, 0.7)";
        ctx.lineWidth = 16;
      } else {
        ctx.strokeStyle = "#0F172A";
        ctx.lineWidth = 2.5;
      }
      ctx.lineCap = "round";
    }
  };

  const draw = (e) => {
    if (!isDrawing || tool === "pointer") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "lasso") {
      setLassoPoints((prev) => [...prev, { x, y }]);
    } else {
      const ctx = canvas.getContext("2d");
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (tool === "lasso" && lassoPoints.length > 2) {
      onLassoSelect(lassoPoints);
      setLassoPoints([]);
    } else if (isDrawing) {
      saveHistory();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  return (
    <div className="relative w-full h-full bg-white overflow-hidden">
      {/* 1. Primary Drawing Tools Group */}
      <div className="absolute top-4 left-6 z-20 flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setTool("pen")}
          className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
            tool === "pen" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Pen"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Pen</span>
        </button>

        <button
          onClick={() => setTool("highlighter")}
          className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
            tool === "highlighter" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Highlighter"
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span>Highlight</span>
        </button>

        <button
          onClick={() => setTool("eraser")}
          className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
            tool === "eraser" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Eraser"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Eraser</span>
        </button>

        <button
          onClick={() => setTool("lasso")}
          className={`p-2 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
            tool === "lasso" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Spatial Lasso"
        >
          <Lasso className="w-3.5 h-3.5" />
          <span>Lasso Focus</span>
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <button
          onClick={() => setTool("rect")}
          className={`p-2 rounded-lg text-xs transition-all ${
            tool === "rect" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Rectangle"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setTool("text")}
          className={`p-2 rounded-lg text-xs transition-all ${
            tool === "text" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Text Label"
        >
          <Type className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setTool("pointer")}
          className={`p-2 rounded-lg text-xs transition-all ${
            tool === "pointer" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          title="Cursor / Select"
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-2 rounded-lg text-xs transition-all ${
            showGrid ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-100"
          }`}
          title="Toggle Grid Guide"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Secondary Canvas Action Controls Group */}
      <div className="absolute top-4 right-6 z-20 flex items-center space-x-1 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
        <button onClick={handleUndo} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" title="Undo (Ctrl+Z)">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleRedo} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" title="Redo (Ctrl+Y)">
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <div className="h-4 w-px bg-slate-200 mx-0.5" />
        <button onClick={clearCanvas} className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors" title="Clear Canvas">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid Pattern Overlay */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20" 
          style={{ backgroundImage: "radial-gradient(#0F172A 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
      )}

      {/* Native HTML5 2D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full h-full cursor-crosshair"
      />

      {/* Real-Time Coordinates & Lasso Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {highlightBoxes.map((box, idx) => {
          const [ymin, xmin, ymax, xmax] = box;
          return (
            <rect
              key={idx}
              x={`${xmin / 10}%`}
              y={`${ymin / 10}%`}
              width={`${(xmax - xmin) / 10}%`}
              height={`${(ymax - ymin) / 10}%`}
              fill="rgba(15, 23, 42, 0.04)"
              stroke="#0F172A"
              strokeWidth="2"
              strokeDasharray="4 4"
              rx="6"
              className="animate-pulse"
            />
          );
        })}

        {lassoPoints.length > 1 && (
          <polygon
            points={lassoPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="rgba(15, 23, 42, 0.08)"
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
        )}
      </svg>
    </div>
  );
}
