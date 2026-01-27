import { useSyncExternalStore, useCallback } from 'react';
import {
  openModal,
  closeModal,
  minimizeModal,
  restoreModal,
  getModalsStore,
  openChildModal,
  subscribe,
  triggerAttention,
  bringToFront,
  isModalRegistered,
} from '../../core/state';
import type { ModalId } from '../../core/types';

function assertRegistered(id: ModalId, method: string): void {
  if (!isModalRegistered(id)) {
    throw new Error(
      `Cannot call ${method}() on unregistered modal "${String(id)}". Ensure the Modal component is rendered.`
    );
  }
}

interface ModalSnapshot {
  isOpen: boolean;
  isMinimized: boolean;
  isRegistered: boolean;
}

const snapshotCache = new Map<ModalId, ModalSnapshot>();

function getModalSnapshot(id: ModalId): ModalSnapshot {
  const store = getModalsStore();
  const modal = store.get(id);

  const isOpen = modal !== undefined && !modal.isMinimized;
  const isMinimized = modal?.isMinimized ?? false;
  const isRegistered = modal !== undefined;

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
  const getSnapshot = useCallback(() => getModalSnapshot(id), [id]);

  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  const open = useCallback((sourceElement: HTMLElement) => {
    assertRegistered(id, 'open');
    openModal(id, sourceElement);
  }, [id]);

  const close = useCallback(() => {
    assertRegistered(id, 'close');
    closeModal(id);
  }, [id]);

  const minimize = useCallback(() => {
    assertRegistered(id, 'minimize');
    minimizeModal(id);
  }, [id]);

  const restore = useCallback(() => {
    assertRegistered(id, 'restore');
    restoreModal(id);
  }, [id]);

  const openChild = useCallback((childId: ModalId, sourceElement?: HTMLElement) => {
    assertRegistered(id, 'openChild');
    openChildModal(childId, id, sourceElement ?? document.body);
  }, [id]);

  const shake = useCallback(() => {
    assertRegistered(id, 'shake');
    triggerAttention(id);
  }, [id]);

  const focus = useCallback(() => {
    assertRegistered(id, 'bringToFront');
    bringToFront(id);
  }, [id]);

  return {
    ...state,
    open,
    close,
    minimize,
    restore,
    openChild,
    shake,
    bringToFront: focus,
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
  const openCount = modalsArray.filter(m => !m.isMinimized).length;

  if (modalsSnapshotCache &&
      modalsSnapshotCache.minimizedCount === minimizedCount &&
      modalsSnapshotCache.openCount === openCount) {

    lastModalsMap = store;
    modalsSnapshotCache = { ...modalsSnapshotCache, modals: store };
    return modalsSnapshotCache;
  }

  lastModalsMap = store;
  modalsSnapshotCache = { modals: store, minimizedCount, openCount };
  return modalsSnapshotCache;
}

export function useModals() {
  return useSyncExternalStore(
    subscribe,
    getModalsSnapshot,
    getModalsSnapshot
  );
}
