import type { BackdropConfig } from '../types';
import { getModalsStore } from '../state';
import { getConfig, normalizeBackdropConfig } from '../config';

export function hasOpenModals(): boolean {
  const store = getModalsStore();
  return Array.from(store.values()).some(
    (m) => m.isOpen && !m.isMinimized && !m.isHiddenWithParent
  );
}

export function getBackdropConfig(): BackdropConfig {
  const config = getConfig();
  return normalizeBackdropConfig(config.features.backdrop);
}

export function isBackdropEnabled(): boolean {
  const backdropConfig = getBackdropConfig();
  return backdropConfig.visible || backdropConfig.blockClicks;
}
