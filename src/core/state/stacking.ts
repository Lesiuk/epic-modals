import type { StackingLayerName } from '../types';
import { getConfig } from '../config';

const StackingLayer: Record<StackingLayerName, number> = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  OVERLAY: 300,
  MODAL: 400,
  DOCK: 8000,
  TOAST: 9000,
};

let nextModalZIndex = StackingLayer.MODAL;

export function initializeStacking(): void {
  nextModalZIndex = getConfig().zIndex.base;
}

export function acquireModalZIndex(): number {
  const zIndex = nextModalZIndex;
  nextModalZIndex += 2;
  return zIndex;
}

export function getLayerZIndex(layer: StackingLayerName): number {
  const config = getConfig();
  if (layer === 'MODAL') return config.zIndex.base;
  if (layer === 'DOCK') return config.zIndex.dock;
  if (layer === 'TOAST') return config.zIndex.toast;
  return StackingLayer[layer];
}

export function resetStacking(): void {
  nextModalZIndex = getConfig().zIndex.base;
}
