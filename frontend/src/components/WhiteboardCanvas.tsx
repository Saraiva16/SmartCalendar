import React, { useRef, useEffect, useState, useCallback } from 'react';
import getStroke from 'perfect-freehand';
import { db } from '../services/dexie';
import { useUIStore } from '../stores/useUIStore';
import type { ContainerType, Point, Stroke } from '../types/whiteboard';
import {
  screenToVirtual,
  virtualToScreen,
  getSvgPathFromStroke,
  VIRTUAL_CANVAS_WIDTH,
} from '../utils/canvas';

interface WhiteboardCanvasProps {
  dateKey: string;
  containerType: ContainerType;
  todoId?: string | null;
  className?: string;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  dateKey,
  containerType,
  todoId = null,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);

  const { toolMode, penColor, penSize } = useUIStore();

  const [currentVirtualPoints, setCurrentVirtualPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [confirmedStrokes, setConfirmedStrokes] = useState<Stroke[]>([]);

  // 1. Carregar traços salvos no Dexie para este container
  const loadStrokes = useCallback(async () => {
    try {
      const strokes = await db.strokes
        .where('date_key')
        .equals(dateKey)
        .filter((s) => s.container_type === containerType && s.todo_id === todoId)
        .toArray();
      setConfirmedStrokes(strokes);
    } catch (err) {
      console.error('Erro ao ler traços do Dexie:', err);
    }
  }, [dateKey, containerType, todoId]);

  useEffect(() => {
    loadStrokes();
  }, [loadStrokes]);

  // 2. Redimensionar e alinhar os canvases ao elemento pai
  const resizeCanvases = useCallback(() => {
    if (!containerRef.current || !staticCanvasRef.current || !liveCanvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    [staticCanvasRef.current, liveCanvasRef.current].forEach((canvas) => {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    });

    renderStaticCanvas();
  }, [confirmedStrokes]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    return () => window.removeEventListener('resize', resizeCanvases);
  }, [resizeCanvases]);

  // 3. Renderizar camada confirmada (Static Canvas)
  const renderStaticCanvas = useCallback(() => {
    if (!staticCanvasRef.current || !containerRef.current) return;
    const canvas = staticCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    confirmedStrokes.forEach((stroke) => {
      // Converte pontos virtuais para pixels reais
      const screenPoints = stroke.points.map((p) =>
        virtualToScreen(p, rect.width, rect.height)
      );

      // Calcula espessura proporcional
      const scale = rect.width / VIRTUAL_CANVAS_WIDTH;
      const computedSize = stroke.size * scale;

      const outline = getStroke(screenPoints, {
        size: Math.max(1, computedSize),
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      });

      const path = getSvgPathFromStroke(outline);
      ctx.fillStyle = stroke.color;
      ctx.fill(path);
    });
  }, [confirmedStrokes]);

  useEffect(() => {
    renderStaticCanvas();
  }, [renderStaticCanvas]);

  // 4. Renderizar traço em tempo real (Live Canvas)
  const renderLiveStroke = useCallback(() => {
    if (!liveCanvasRef.current || !containerRef.current) return;
    const canvas = liveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (currentVirtualPoints.length === 0 || toolMode === 'eraser') return;

    const screenPoints = currentVirtualPoints.map((p) =>
      virtualToScreen(p, rect.width, rect.height)
    );

    const scale = rect.width / VIRTUAL_CANVAS_WIDTH;
    const computedSize = penSize * scale;

    const outline = getStroke(screenPoints, {
      size: Math.max(1, computedSize),
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true,
    });

    const path = getSvgPathFromStroke(outline);
    ctx.fillStyle = penColor;
    ctx.fill(path);
  }, [currentVirtualPoints, penColor, penSize, toolMode]);

  useEffect(() => {
    renderLiveStroke();
  }, [renderLiveStroke]);

  // 5. Apagador de traço por colisão / proximidade
  const eraseNear = async (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const virtualPoint = screenToVirtual(clientX, clientY, rect);

    const threshold = 35; // Raio virtual de detecção da borracha

    const remainingStrokes: Stroke[] = [];
    const strokesToDelete: string[] = [];

    confirmedStrokes.forEach((s) => {
      // Verifica se algum ponto do traço está no raio de apagar
      const intersects = s.points.some(([x, y]) => {
        const dx = x - virtualPoint[0];
        const dy = y - virtualPoint[1];
        return Math.sqrt(dx * dx + dy * dy) < threshold;
      });

      if (intersects) {
        strokesToDelete.push(s.stroke_id);
      } else {
        remainingStrokes.push(s);
      }
    });

    if (strokesToDelete.length > 0) {
      setConfirmedStrokes(remainingStrokes);
      await Promise.all(strokesToDelete.map((id) => db.strokes.delete(id)));
    }
  };

  // 6. Manipuladores de PointerEvents
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    if (toolMode === 'eraser') {
      eraseNear(e.clientX, e.clientY);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pt = screenToVirtual(e.clientX, e.clientY, rect);
    setCurrentVirtualPoints([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing) return;

    if (toolMode === 'eraser') {
      eraseNear(e.clientX, e.clientY);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Suporte a coalesced events se disponível para latência mínima
    const events = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [e];
    const newPoints = events.map((ev) => screenToVirtual(ev.clientX, ev.clientY, rect));

    setCurrentVirtualPoints((prev) => [...prev, ...newPoints]);
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignora se o ponteiro já tiver sido liberado
    }

    if (toolMode === 'pen' && currentVirtualPoints.length > 0) {
      const newStroke: Stroke = {
        stroke_id: crypto.randomUUID(),
        date_key: dateKey,
        container_type: containerType,
        todo_id: todoId,
        color: penColor,
        size: penSize,
        points: currentVirtualPoints,
        created_at: new Date().toISOString(),
        is_synced: false,
      };

      // Gravação local imediata (Zero Latency)
      await db.strokes.put(newStroke);
      setConfirmedStrokes((prev) => [...prev, newStroke]);
      setCurrentVirtualPoints([]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden touch-none select-none ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Camada Estática de Baixo Custo de CPU */}
      <canvas ref={staticCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Camada Dinâmica em Tempo Real */}
      <canvas ref={liveCanvasRef} className="absolute inset-0 pointer-events-none" />
    </div>
  );
};
