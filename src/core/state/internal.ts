import type {
  ModalState,
  ModalId,
  Position,
  Dimensions,
  AnimationTransform,
} from '../types';

const SINGLETON_KEY = Symbol.for('epic-modals-core');
type GlobalWithModals = typeof globalThis & { [key: symbol]: boolean };

if (typeof globalThis !== 'undefined') {
  const g = globalThis as GlobalWithModals;
  if (g[SINGLETON_KEY]) {
    console.warn(
      '[epic-modals] Core module loaded multiple times. This causes state synchronization issues.\n' +
      'Your bundler is not deduplicating the shared module correctly.\n' +
      'Check your bundler configuration to ensure proper module resolution.'
    );
  }
  g[SINGLETON_KEY] = true;
}

export interface URLStateCallbacks {
  push: (id: ModalId) => void;
  replace: (id: ModalId) => void;
  pop: () => void;
}

export type DockPositionGetter = () => { x: number; y: number; width: number; height: number };

export interface RegistryCallbacks {
  mountModal: (id: ModalId) => void;
  isRegisteredInRegistry: (id: ModalId) => boolean;
  unmountModal: (id: ModalId) => void;
}

export const modals: Map<ModalId, ModalState> = new Map();

let stateVersion = 0;

export let rearrangementTimeout: ReturnType<typeof setTimeout> | null = null;
export function setRearrangementTimeout(timeout: ReturnType<typeof setTimeout> | null): void {
  rearrangementTimeout = timeout;
}

export let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
export function setResizeTimeout(timeout: ReturnType<typeof setTimeout> | null): void {
  resizeTimeout = timeout;
}

const subscribers = new Set<() => void>();

let isBatching = false;
let pendingNotify = false;

let isNotifying = false;

export let pendingMinimize: ModalId[] = [];
export let pendingOpen: ModalId[] = [];
export let pendingClose: ModalId[] = [];
export let pendingForceClose: ModalId[] = [];
export let pendingRestore: ModalId[] = [];
export let pendingChildRestore: ModalId[] = [];
export let pendingMinimizeWithParent: ModalId[] = [];
export let pendingAttention: ModalId[] = [];
export let activeAttention: ModalId[] = [];

export let pendingMinimizeTarget: AnimationTransform | null = null;
export function setPendingMinimizeTarget(target: AnimationTransform | null): void {
  pendingMinimizeTarget = target;
}

export const openSourcePositions: Map<ModalId, Position> = new Map();

export let pendingParentLink: { parentId: ModalId; childId: ModalId } | null = null;
export function setPendingParentLink(link: { parentId: ModalId; childId: ModalId } | null): void {
  pendingParentLink = link;
}

export const pendingParentAnimations: Map<ModalId, Position> = new Map();

export const animatingModals: Set<ModalId> = new Set();

export const closingModals: Set<ModalId> = new Set();

export const transparentModals: Set<ModalId> = new Set();

export let dockOrder: ModalId[] = [];
export function setDockOrder(order: ModalId[]): void {
  dockOrder = order;
}

export let urlCallbacks: URLStateCallbacks | null = null;
export function setURLCallbacks(callbacks: URLStateCallbacks | null): void {
  urlCallbacks = callbacks;
}

export let dockPositionGetter: DockPositionGetter | null = null;
export function setDockPositionGetterInternal(getter: DockPositionGetter | null): void {
  dockPositionGetter = getter;
}

export let registryCallbacks: RegistryCallbacks | null = null;
export function setRegistryCallbacksInternal(callbacks: RegistryCallbacks | null): void {
  registryCallbacks = callbacks;
}

export function setPendingMinimize(arr: ModalId[]): void {
  pendingMinimize = arr;
}
export function setPendingOpen(arr: ModalId[]): void {
  pendingOpen = arr;
}
export function setPendingClose(arr: ModalId[]): void {
  pendingClose = arr;
}
export function setPendingForceClose(arr: ModalId[]): void {
  pendingForceClose = arr;
}
export function setPendingRestore(arr: ModalId[]): void {
  pendingRestore = arr;
}
export function setPendingChildRestore(arr: ModalId[]): void {
  pendingChildRestore = arr;
}
export function setPendingMinimizeWithParent(arr: ModalId[]): void {
  pendingMinimizeWithParent = arr;
}
export function setPendingAttention(arr: ModalId[]): void {
  pendingAttention = arr;
}
export function setActiveAttention(arr: ModalId[]): void {
  activeAttention = arr;
}

function notifySubscribers(): void {
  if (isNotifying) {
    return;
  }
  isNotifying = true;
  try {
    subscribers.forEach(callback => callback());
  } finally {
    isNotifying = false;
  }
}

export function incrementVersion(): void {
  stateVersion++;
  if (isBatching) {
    pendingNotify = true;
    return;
  }
  notifySubscribers();
}

export function getStateVersion(): number {
  return stateVersion;
}

export function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function batchUpdates(callback: () => void): void {
  const wasBatching = isBatching;
  isBatching = true;
  try {
    callback();
  } finally {
    isBatching = wasBatching;
    if (!wasBatching && pendingNotify) {
      pendingNotify = false;
      queueMicrotask(() => {
        notifySubscribers();
      });
    }
  }
}

export function validatePosition(position: Position, context: string): void {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    throw new Error(`[epic-modals] Invalid position in ${context}: x=${position.x}, y=${position.y}`);
  }
}

export function validateDimensions(size: Dimensions, context: string): void {
  if (size.width <= 0 || size.height <= 0) {
    throw new Error(`[epic-modals] Invalid dimensions in ${context}: width=${size.width}, height=${size.height}`);
  }
}

function isDevelopment(): boolean {
  try {
    const meta = import.meta as { env?: { DEV?: boolean; MODE?: string } };
    return meta.env?.DEV === true || meta.env?.MODE === 'development';
  } catch {
    return false;
  }
}

export function warnIfUnregistered(id: ModalId, method: string): boolean {
  const modal = modals.get(id);
  if (!modal) {
    if (isDevelopment()) {
      console.warn(`[epic-modals] ${method} called for unregistered modal: ${String(id)}`);
    }
    return false;
  }
  return true;
}

export function _resetInternalState(): void {
  modals.clear();
  pendingMinimize = [];
  pendingOpen = [];
  pendingClose = [];
  pendingForceClose = [];
  pendingRestore = [];
  pendingChildRestore = [];
  pendingMinimizeWithParent = [];
  pendingAttention = [];
  activeAttention = [];
  pendingMinimizeTarget = null;
  openSourcePositions.clear();
  pendingParentLink = null;
  pendingParentAnimations.clear();
  animatingModals.clear();
  closingModals.clear();
  transparentModals.clear();
  dockOrder = [];
  urlCallbacks = null;
  dockPositionGetter = null;
  registryCallbacks = null;
  if (rearrangementTimeout) {
    clearTimeout(rearrangementTimeout);
    rearrangementTimeout = null;
  }
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
}

export function _getInternalState() {
  return {
    modals,
    pendingMinimize,
    pendingOpen,
    pendingClose,
    pendingRestore,
    dockOrder,
    animatingModals,
    transparentModals,
  };
}
