import type { Point } from '../types/whiteboard';

// Espaço lógico padrão para manter aspecto fixo em qualquer resolução
export const VIRTUAL_CANVAS_WIDTH = 1000;
export const VIRTUAL_CANVAS_HEIGHT = 1400;

/**
 * Converte coordenadas do evento de ponteiro da tela (pixels CSS)
 * para coordenadas virtuais normalizadas no espaço fixo do container.
 */
export function screenToVirtual(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  virtualWidth = VIRTUAL_CANVAS_WIDTH,
  virtualHeight = VIRTUAL_CANVAS_HEIGHT
): Point {
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;

  // Clamping para garantir que o traço não saia do container (clipping por container)
  const clampedX = Math.max(0, Math.min(rect.width, relX));
  const clampedY = Math.max(0, Math.min(rect.height, relY));

  const scaleX = virtualWidth / rect.width;
  const scaleY = virtualHeight / rect.height;

  const vx = Math.round(clampedX * scaleX * 10) / 10;
  const vy = Math.round(clampedY * scaleY * 10) / 10;

  return [vx, vy, 0.5]; // Presume 0.5 de pressão por padrão (otimizado para molduras IR)
}

/**
 * Converte coordenadas virtuais para pixels reais no canvas renderizado.
 */
export function virtualToScreen(
  virtualPoint: Point,
  canvasWidth: number,
  canvasHeight: number,
  virtualWidth = VIRTUAL_CANVAS_WIDTH,
  virtualHeight = VIRTUAL_CANVAS_HEIGHT
): [number, number, number] {
  const [vx, vy, pressure] = virtualPoint;
  const sx = (vx / virtualWidth) * canvasWidth;
  const sy = (vy / virtualHeight) * canvasHeight;
  return [sx, sy, pressure];
}

/**
 * Converte pontos do contorno gerados pelo perfect-freehand em Path2D do Canvas
 */
export function getSvgPathFromStroke(strokePoints: number[][]): Path2D {
  const path = new Path2D();
  if (strokePoints.length === 0) return path;

  const [firstX, firstY] = strokePoints[0];
  path.moveTo(firstX, firstY);

  for (let i = 1; i < strokePoints.length - 1; i++) {
    const [p0x, p0y] = strokePoints[i];
    const [p1x, p1y] = strokePoints[i + 1];
    const midX = (p0x + p1x) / 2;
    const midY = (p0y + p1y) / 2;
    path.quadraticCurveTo(p0x, p0y, midX, midY);
  }

  const lastPoint = strokePoints[strokePoints.length - 1];
  if (lastPoint) {
    path.lineTo(lastPoint[0], lastPoint[1]);
  }
  path.closePath();

  return path;
}

