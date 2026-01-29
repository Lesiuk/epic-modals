import type {
  ModalState,
  ModalId,
  Position,
  Dimensions,
  AnimationTransform,
} from '../types';
import { pending } from './pending-factory';
import { _resetSymbolIds, SYMBOL_PREFIX } from '../utils/helpers';

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

export let maxZIndex = 0;

export function updateMaxZIndex(z: number): void {
  if (z > maxZIndex) maxZIndex = z;
}

export function recalcMaxZIndex(): void {
  maxZIndex = 0;
  for (const m of modals.values()) {
    if (m.zIndex > maxZIndex) maxZIndex = m.zIndex;
  }
}

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

export function validateModalId(id: unknown, functionName: string): asserts id is ModalId {
  if (id === undefined || id === null) {
    throw new Error(
      `${functionName}: Missing required 'id' parameter. ` +
      `Expected a modal ID (string or symbol), got ${id === null ? 'null' : 'undefined'}.`
    );
  }
  if (typeof id === 'symbol') return;
  if (typeof id !== 'string') {
    throw new Error(
      `${functionName}: Invalid 'id' parameter. ` +
      `Expected a string or symbol, got ${typeof id}.`
    );
  }
  if (id.trim() === '') {
    throw new Error(
      `${functionName}: Invalid 'id' parameter. ` +
      `Modal ID cannot be an empty string.`
    );
  }
  if (id.startsWith(SYMBOL_PREFIX)) {
    throw new Error(
      `${functionName}: Invalid 'id' parameter. ` +
      `String IDs cannot start with '${SYMBOL_PREFIX}' (reserved for symbol IDs).`
    );
  }
}

function isPosition(value: unknown): value is Position {
  return (
    typeof value === 'object' &&
    value !== null &&
    'x' in value &&
    'y' in value &&
    typeof (value as Position).x === 'number' &&
    typeof (value as Position).y === 'number'
  );
}

export function validateSource(
  source: unknown,
  functionName: string
): asserts source is HTMLElement | Position {
  if (source === undefined || source === null) {
    throw new Error(
      `${functionName}: Missing required 'source' parameter. ` +
      `Expected an HTMLElement (the button that triggered the modal) or a Position object {x, y}. ` +
      `Example: openModal('my-modal', event.currentTarget) or openModal('my-modal', {x: 100, y: 100})`
    );
  }

  if (typeof HTMLElement !== 'undefined' && source instanceof HTMLElement) {
    return;
  }

  if (isPosition(source)) {
    return;
  }

  const typeDesc = typeof source === 'object'
    ? `object (keys: ${Object.keys(source as object).join(', ') || 'none'})`
    : typeof source;

  throw new Error(
    `${functionName}: Invalid 'source' parameter. ` +
    `Expected an HTMLElement or Position object {x: number, y: number}, got ${typeDesc}. ` +
    `The source is used to animate the modal opening from the trigger element's position.`
  );
}

export function validateParentId(
  parentId: unknown,
  functionName: string
): asserts parentId is ModalId {
  if (parentId === undefined || parentId === null) {
    throw new Error(
      `${functionName}: Missing required 'parentId' parameter. ` +
      `Expected the ID of the parent modal that this child should be linked to.`
    );
  }
  if (typeof parentId === 'symbol') return;
  if (typeof parentId !== 'string') {
    throw new Error(
      `${functionName}: Invalid 'parentId' parameter. ` +
      `Expected a string or symbol, got ${typeof parentId}.`
    );
  }
  if (parentId.trim() === '') {
    throw new Error(
      `${functionName}: Invalid 'parentId' parameter. ` +
      `Parent modal ID cannot be an empty string.`
    );
  }
}

export type EventCallback<T = void> = (data: T) => void;

export function createEventEmitter<T>() {

  const listeners = new Map<keyof T, Set<EventCallback<any>>>();

  return {

    on<K extends keyof T>(event: K, callback: EventCallback<T[K]>): () => void {
      let set = listeners.get(event);
      if (!set) {
        set = new Set();
        listeners.set(event, set);
      }
      set.add(callback);

      return () => {
        set?.delete(callback);
        if (set?.size === 0) {
          listeners.delete(event);
        }
      };
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      const set = listeners.get(event);
      if (set) {
        set.forEach((callback) => callback(data));
      }
    },

    off<K extends keyof T>(event?: K): void {
      if (event) {
        listeners.delete(event);
      } else {
        listeners.clear();
      }
    },

    listenerCount<K extends keyof T>(event: K): number {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

export type EventEmitter<T> = ReturnType<typeof createEventEmitter<T>>;

export function _resetInternalState(): void {
  modals.clear();
  maxZIndex = 0;
  _resetSymbolIds();
  pending.reset();
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
    pending,
    dockOrder,
    animatingModals,
    transparentModals,
  };
}
