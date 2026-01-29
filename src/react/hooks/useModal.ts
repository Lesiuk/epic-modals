import { useSyncExternalStore, useMemo } from 'react';
import { getModalsStore, subscribe } from '../../core/state';
import { createModalOperations } from '../../core/modal-operations';
import type { ModalId } from '../../core/types';

interface ModalSnapshot {
  isOpen: boolean;
  isMinimized: boolean;
  isRegistered: boolean;
}

const snapshotCache = new Map<ModalId, ModalSnapshot>();

function getModalSnapshot(id: ModalId): ModalSnapshot {
  const store = getModalsStore();
  const modal = store.get(id);

  const isOpen = modal?.isOpen === true && !modal.isMinimized;
  const isMinimized = modal?.isMinimized ?? false;
  const isRegistered = modal !== undefined;

  if (!isRegistered) {
    snapshotCache.delete(id);
    return { isOpen: false, isMinimized: false, isRegistered: false };
  }

  const cached = snapshotCache.get(id);
  if (cached &&
      cached.isOpen === isOpen &&
      cached.isMinimized === isMinimized &&
      cached.isRegistered === isRegistered) {
    return cached;
  }

  const snapshot: ModalSnapshot = { isOpen, isMinimized, isRegistered };
  snapshotCache.set(id, snapshot);
  return snapshot;
}

export function useModal(id: ModalId) {
  const getSnapshot = useMemo(() => () => getModalSnapshot(id), [id]);
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const ops = useMemo(() => createModalOperations(() => id), [id]);

  return {
    ...state,
    ...ops,
  };
}

interface ModalsSnapshot {
  modals: Map<ModalId, unknown>;
  minimizedCount: number;
  openCount: number;
}

let lastModalsMap: Map<ModalId, unknown> | null = null;
let modalsSnapshotCache: ModalsSnapshot | null = null;

function getModalsSnapshot(): ModalsSnapshot {
  const store = getModalsStore();

  if (lastModalsMap === store && modalsSnapshotCache) {
    return modalsSnapshotCache;
  }

  const modalsArray = Array.from(store.values());
  const minimizedCount = modalsArray.filter(m => m.isMinimized).length;
  const openCount = modalsArray.filter(m => !m.isMinimized && m.isOpen).length;

  if (modalsSnapshotCache &&
      modalsSnapshotCache.minimizedCount === minimizedCount &&
      modalsSnapshotCache.openCount === openCount) {
    lastModalsMap = store;
    return modalsSnapshotCache;
  }

  lastModalsMap = store;
  modalsSnapshotCache = { modals: store, minimizedCount, openCount };
  return modalsSnapshotCache;
}

export function useModals() {
  return useSyncExternalStore(subscribe, getModalsSnapshot, getModalsSnapshot);
}
