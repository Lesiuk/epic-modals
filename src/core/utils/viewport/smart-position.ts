import type { Position } from '../../types';
import type { ModalBounds, ModalLayoutInfo, SmartLayoutOptions, SmartLayoutResult } from './types';
import { calculateOverlap, calculateTotalOverlap } from './overlap';

interface AvailableArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridConfig {
  cols: number;
  rows: number;

  score: number;
  positions: Map<string, Position>;
}

interface ModalToPlace {
  id: string;
  width: number;
  height: number;
}

export function computeAvailableArea(
  vw: number,
  vh: number,
  margin: number,
  avoidBounds: ModalBounds[],
  avoidMargin: number
): AvailableArea {
  let left = margin;
  let top = margin;
  let right = vw - margin;
  let bottom = vh - margin;

  for (const avoid of avoidBounds) {
    const distTop = avoid.y;
    const distBottom = vh - (avoid.y + avoid.height);
    const distLeft = avoid.x;
    const distRight = vw - (avoid.x + avoid.width);

    let edge: 'top' | 'bottom' | 'left' | 'right';
    if (avoid.width > avoid.height) {

      edge = distTop <= distBottom ? 'top' : 'bottom';
    } else if (avoid.height > avoid.width) {

      edge = distLeft <= distRight ? 'left' : 'right';
    } else {

      const minDist = Math.min(distTop, distBottom, distLeft, distRight);
      if (minDist === distTop) edge = 'top';
      else if (minDist === distBottom) edge = 'bottom';
      else if (minDist === distLeft) edge = 'left';
      else edge = 'right';
    }

    if (edge === 'bottom') {
      bottom = Math.min(bottom, avoid.y - avoidMargin);
    } else if (edge === 'top') {
      top = Math.max(top, avoid.y + avoid.height + avoidMargin);
    } else if (edge === 'left') {
      left = Math.max(left, avoid.x + avoid.width + avoidMargin);
    } else {
      right = Math.min(right, avoid.x - avoidMargin);
    }
  }

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function computeGaps(
  axisSize: number,
  totalModalSize: number,
  count: number,
  modalGap: number
): { interGap: number; edgeGap: number } {
  const remaining = axisSize - totalModalSize;
  const interCount = count - 1;
  const totalSlots = count + 1;

  if (remaining <= 0) {
    return { interGap: 0, edgeGap: 0 };
  }

  if (count <= 1) {
    return { interGap: 0, edgeGap: remaining / 2 };
  }

  const equalGap = remaining / totalSlots;

  if (equalGap >= modalGap) {
    return { interGap: equalGap, edgeGap: equalGap };
  }

  const interSpace = interCount * modalGap;
  if (remaining >= interSpace) {
    const edgeGap = (remaining - interSpace) / 2;
    return { interGap: modalGap, edgeGap };
  }

  return { interGap: remaining / interCount, edgeGap: 0 };
}

export function tryGridConfig(
  cols: number,
  rows: number,
  modals: ModalToPlace[],
  area: AvailableArea,
  modalGap: number = 0
): GridConfig | null {
  if (modals.length === 0) {
    return { cols, rows, score: Infinity, positions: new Map() };
  }

  const colWidths: number[] = new Array(cols).fill(0);
  const rowHeights: number[] = new Array(rows).fill(0);

  for (let i = 0; i < modals.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    colWidths[col] = Math.max(colWidths[col], modals[i].width);
    rowHeights[row] = Math.max(rowHeights[row], modals[i].height);
  }

  const totalModalWidth = colWidths.reduce((a, b) => a + b, 0);
  const totalModalHeight = rowHeights.reduce((a, b) => a + b, 0);

  if (totalModalWidth > area.width || totalModalHeight > area.height) return null;

  const { interGap: hInterGap, edgeGap: hEdgeGap } = computeGaps(area.width, totalModalWidth, cols, modalGap);
  const { interGap: vInterGap, edgeGap: vEdgeGap } = computeGaps(area.height, totalModalHeight, rows, modalGap);

  const positions = new Map<string, Position>();

  const cumColWidths: number[] = [0];
  for (let c = 0; c < cols; c++) {
    cumColWidths.push(cumColWidths[c] + colWidths[c]);
  }
  const cumRowHeights: number[] = [0];
  for (let r = 0; r < rows; r++) {
    cumRowHeights.push(cumRowHeights[r] + rowHeights[r]);
  }

  for (let i = 0; i < modals.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const modal = modals[i];

    const cellX = area.x + hEdgeGap + col * hInterGap + cumColWidths[col];
    const cellY = area.y + vEdgeGap + row * vInterGap + cumRowHeights[row];

    const x = cellX + (colWidths[col] - modal.width) / 2;
    const y = cellY + (rowHeights[row] - modal.height) / 2;

    positions.set(modal.id, { x: Math.round(x), y: Math.round(y) });
  }

  const hScore = cols > 1 ? hInterGap : hEdgeGap;
  const vScore = rows > 1 ? vInterGap : vEdgeGap;
  const minGap = Math.min(hScore, vScore);
  const geoMean = Math.sqrt(hScore * vScore);
  const baseScore = 0.6 * minGap + 0.4 * geoMean;

  const viewportIsLandscape = area.width > area.height;
  const configIsLandscape = cols >= rows;
  const aspectBonus = (viewportIsLandscape === configIsLandscape) ? 1.02 : 1.0;

  const score = baseScore * aspectBonus;

  return { cols, rows, score, positions };
}

export function findLeastOverlapPosition(
  width: number,
  height: number,
  existingBounds: ModalBounds[],
  area: AvailableArea,
  gridResolution: number = 20
): Position {
  const centerX = area.x + (area.width - width) / 2;
  const centerY = area.y + (area.height - height) / 2;

  if (existingBounds.length === 0) {
    return { x: Math.round(centerX), y: Math.round(centerY) };
  }

  const minX = area.x;
  const maxX = Math.max(area.x, area.x + area.width - width);
  const minY = area.y;
  const maxY = Math.max(area.y, area.y + area.height - height);

  if (maxX <= minX || maxY <= minY) {
    return { x: Math.round(centerX), y: Math.round(centerY) };
  }

  const stepX = (maxX - minX) / gridResolution;
  const stepY = (maxY - minY) / gridResolution;

  let bestPos: Position = { x: centerX, y: centerY };
  let bestScore = Infinity;

  const modalArea = width * height;
  const maxDist = Math.hypot(area.width / 2, area.height / 2);
  const areaCenterX = area.x + area.width / 2;
  const areaCenterY = area.y + area.height / 2;

  for (let i = 0; i <= gridResolution; i++) {
    for (let j = 0; j <= gridResolution; j++) {
      const x = minX + i * stepX;
      const y = minY + j * stepY;
      const overlap = calculateTotalOverlap(x, y, width, height, existingBounds, 0);

      const normalizedOverlap = modalArea > 0 ? overlap / modalArea : 0;
      const distFromCenter = Math.hypot(
        x + width / 2 - areaCenterX,
        y + height / 2 - areaCenterY,
      );
      const normalizedDist = maxDist > 0 ? distFromCenter / maxDist : 0;
      const score = 0.5 * normalizedOverlap + 0.5 * normalizedDist;

      if (score < bestScore) {
        bestScore = score;
        bestPos = { x, y };
      }
    }
  }

  return { x: Math.round(bestPos.x), y: Math.round(bestPos.y) };
}

export function createCascadeLayout(
  modals: ModalToPlace[],
  area: AvailableArea
): Map<string, Position> {
  const TITLE_BAR_HEIGHT = 40;
  const positions = new Map<string, Position>();

  const largestWidth = Math.max(...modals.map(m => m.width));
  const largestHeight = Math.max(...modals.map(m => m.height));
  const cascadeWidth = largestWidth + (modals.length - 1) * TITLE_BAR_HEIGHT;
  const cascadeHeight = largestHeight + (modals.length - 1) * TITLE_BAR_HEIGHT;

  let startX = area.x + (area.width - cascadeWidth) / 2;
  let startY = area.y + (area.height - cascadeHeight) / 2;

  startX = Math.max(area.x, startX);
  startY = Math.max(area.y, startY);

  for (let i = 0; i < modals.length; i++) {
    positions.set(modals[i].id, {
      x: Math.round(startX + i * TITLE_BAR_HEIGHT),
      y: Math.round(startY + i * TITLE_BAR_HEIGHT),
    });
  }

  return positions;
}

export function calculateEqualSpaceLayout(
  existingModals: ModalLayoutInfo[],
  newModal: { id: string; width: number; height: number } | null,
  options: SmartLayoutOptions = {}
): SmartLayoutResult {
  const {
    modalGap = 16,
    viewportMargin = 16,
    avoidBounds = [],
    avoidMargin = 24,
  } = options;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const positions = new Map<string, Position>();

  const nonChildModals = existingModals.filter(m => !m.parentId);

  const modalsToPlace: ModalToPlace[] = nonChildModals.map(m => ({
    id: m.id,
    width: m.width,
    height: m.height,
  }));

  if (newModal) {
    modalsToPlace.push({
      id: newModal.id,
      width: newModal.width,
      height: newModal.height,
    });
  }

  if (modalsToPlace.length === 0) {
    return { positions };
  }

  const existingPositionMap = new Map(
    nonChildModals.map(m => [m.id, m.currentPosition])
  );

  modalsToPlace.sort((a, b) => {
    const posA = existingPositionMap.get(a.id);
    const posB = existingPositionMap.get(b.id);
    const xA = posA ? posA.x + a.width / 2 : Infinity;
    const xB = posB ? posB.x + b.width / 2 : Infinity;
    return xA - xB;
  });

  const area = computeAvailableArea(vw, vh, viewportMargin, avoidBounds, avoidMargin);

  if (modalsToPlace.length === 1) {
    const modal = modalsToPlace[0];
    const x = area.x + (area.width - modal.width) / 2;
    const y = area.y + (area.height - modal.height) / 2;
    positions.set(modal.id, { x: Math.round(x), y: Math.round(y) });
    return { positions };
  }

  const n = modalsToPlace.length;
  let bestConfig: GridConfig | null = null;

  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const config = tryGridConfig(cols, rows, modalsToPlace, area, modalGap);

    if (config && (bestConfig === null || config.score > bestConfig.score)) {
      bestConfig = config;
    }
  }

  if (bestConfig) {
    for (const [id, pos] of bestConfig.positions) {
      positions.set(id, pos);
    }
    return { positions };
  }

  if (newModal) {
    const existingBounds: ModalBounds[] = nonChildModals.map(m => ({
      x: m.currentPosition.x,
      y: m.currentPosition.y,
      width: m.width,
      height: m.height,
    }));

    const pos = findLeastOverlapPosition(
      newModal.width,
      newModal.height,
      existingBounds,
      area
    );
    positions.set(newModal.id, pos);
    return { positions };
  }

  const cascadePositions = createCascadeLayout(modalsToPlace, area);
  return { positions: cascadePositions };
}
