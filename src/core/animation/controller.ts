import type { Position, Dimensions, AnimationTransform } from '../types';
import { createEventEmitter } from '../state/events';
import { DURATIONS, TIMEOUT_SAFETY_MARGIN, type AnimationType } from './timing';
import {
  calculateMinimizeTransform,
  calculateRestoreTransform,
  calculateOpenTransform,
  getDockItemPosition,
} from './genie';
import { setupAnimationEndListener, ANIMATION_NAMES } from '../utils/dom';

const ANIMATION_COMPLETION_TABLE: Record<string, AnimationType[]> = {
  [ANIMATION_NAMES.MINIMIZE]: ['minimize'],
  [ANIMATION_NAMES.RESTORE]: ['restore', 'open'],
  [ANIMATION_NAMES.CLOSE]: ['close'],
  [ANIMATION_NAMES.CLOSE_CENTERED]: ['close'],
  [ANIMATION_NAMES.CHILD_APPEAR]: ['open'],
  [ANIMATION_NAMES.CHILD_DISAPPEAR]: ['close'],
};

export interface AnimationState {
  type: AnimationType;
  isAnimating: boolean;
  transform: AnimationTransform | null;
}

export interface AnimationEvents {
  change: AnimationState;
  animationStart: { type: AnimationType };
  animationEnd: { type: AnimationType };
}

export interface AnimationControllerOptions {

  getId: () => string;

  getElement: () => HTMLElement | null;

  getPosition: () => Position;

  setPosition: (pos: Position) => void;

  getHasBeenDragged: () => boolean;

  setHasBeenDragged: (value: boolean) => void;

  getHasBeenResized: () => boolean;

  getSize: () => Dimensions;

  areAnimationsEnabled?: () => boolean;

  onMinimizeComplete?: (position: Position, hasBeenDragged: boolean, size: Dimensions) => void;

  onOpenStart?: () => void;
}

export interface AnimationController {

  getState(): AnimationState;
  isAnimating(): boolean;
  getAnimationType(): AnimationType;
  getTransform(): AnimationTransform | null;

  getPendingOpenSource(): Position | null;
  setPendingOpenSource(source: Position | null): void;

  startMinimize(customTarget?: Position, onComplete?: () => void): boolean;
  startRestore(storePosition: Position | undefined, modalSize: Dimensions | undefined): void;
  startOpen(): boolean;
  startClose(onComplete: () => void): boolean;

  forceClearMinimize(): void;
  destroy(): void;

  subscribe(callback: (state: AnimationState) => void): () => void;
}

export function createAnimationController(options: AnimationControllerOptions): AnimationController {
  const {
    getId,
    getElement,
    getPosition,
    setPosition,
    getHasBeenDragged,
    setHasBeenDragged,
    getHasBeenResized,
    getSize,
    areAnimationsEnabled = () => true,
    onMinimizeComplete,
    onOpenStart,
  } = options;

  let animationType: AnimationType = 'none';
  let isAnimating = false;
  let transform: AnimationTransform | null = null;
  let pendingOpenSource: Position | null = null;
  let minimizeTimer: ReturnType<typeof setTimeout> | null = null;
  let closeCallback: (() => void) | null = null;

  let minimizeCallback: (() => void) | null = null;
  let minimizeData: { position: Position; size: Dimensions } | null = null;

  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  let cleanupAnimationListener: (() => void) | null = null;

  const emitter = createEventEmitter<AnimationEvents>();

  function getState(): AnimationState {
    return {
      type: animationType,
      isAnimating,
      transform: transform ? { ...transform } : null,
    };
  }

  function notify() {
    emitter.emit('change', getState());
  }

  function clearMinimizeTimer() {
    if (minimizeTimer) {
      clearTimeout(minimizeTimer);
      minimizeTimer = null;
    }
  }

  function clearFallbackTimer() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function setupListener() {
    const el = getElement();
    if (!el || cleanupAnimationListener) return;

    cleanupAnimationListener = setupAnimationEndListener(el, handleAnimationEnd);
  }

  function handleAnimationEnd(animationName: string) {
    clearFallbackTimer();

    const validTypes = ANIMATION_COMPLETION_TABLE[animationName];
    if (!validTypes || !validTypes.includes(animationType)) {
      return;
    }

    const completionHandlers: Record<AnimationType, (() => void) | undefined> = {
      none: undefined,
      minimize: completeMinimize,
      restore: completeRestore,
      open: completeOpen,
      close: completeClose,
      attention: undefined,
    };

    const handler = completionHandlers[animationType];
    if (handler) {
      handler();
    }
  }

  function completeMinimize() {
    if (animationType !== 'minimize') return;
    clearFallbackTimer();

    if (minimizeCallback) {
      minimizeCallback();
      minimizeCallback = null;
    } else if (minimizeData) {
      onMinimizeComplete?.(minimizeData.position, true, minimizeData.size);
    }

    emitter.emit('animationEnd', { type: 'minimize' });
    minimizeData = null;

  }

  function completeRestore() {
    if (animationType !== 'restore') return;
    clearFallbackTimer();

    animationType = 'none';
    isAnimating = false;
    transform = null;

    const el = getElement();
    if (el) {
      el.setAttribute('data-state', 'open');
      el.setAttribute('data-animation-phase', 'idle');
    }

    emitter.emit('animationEnd', { type: 'restore' });
    notify();
  }

  function completeOpen() {
    if (animationType !== 'open') return;
    clearFallbackTimer();

    animationType = 'none';
    isAnimating = false;
    transform = null;

    const el = getElement();
    if (el) {
      el.setAttribute('data-state', 'open');
      el.setAttribute('data-animation-phase', 'idle');
    }

    emitter.emit('animationEnd', { type: 'open' });
    notify();
  }

  function completeClose() {
    if (animationType !== 'close') return;
    clearFallbackTimer();

    animationType = 'none';
    isAnimating = false;

    const el = getElement();
    if (el) {
      el.setAttribute('data-state', 'closed');
      el.setAttribute('data-animation-phase', 'idle');
    }

    emitter.emit('animationEnd', { type: 'close' });
    if (closeCallback) {
      closeCallback();
      closeCallback = null;
    }
    notify();
  }

  function startMinimize(customTarget?: Position, onComplete?: () => void): boolean {
    const modalEl = getElement();
    if (isAnimating || !modalEl) return false;

    setupListener();
    clearMinimizeTimer();
    clearFallbackTimer();

    if (!areAnimationsEnabled()) {
      const rect = modalEl.getBoundingClientRect();
      const posToStore = getHasBeenDragged() ? getPosition() : { x: rect.left, y: rect.top };
      const sizeToStore = getHasBeenResized() ? getSize() : { width: rect.width, height: rect.height };

      if (!getHasBeenDragged()) {
        setPosition(posToStore);
        setHasBeenDragged(true);
      }

      if (onComplete) {
        onComplete();
      } else {
        onMinimizeComplete?.(posToStore, true, sizeToStore);
      }
      return true;
    }

    const rect = modalEl.getBoundingClientRect();
    const posToStore = getHasBeenDragged() ? getPosition() : { x: rect.left, y: rect.top };
    const sizeToStore = getHasBeenResized() ? getSize() : { width: rect.width, height: rect.height };

    if (!getHasBeenDragged()) {
      setPosition(posToStore);
      setHasBeenDragged(true);
    }

    const target = customTarget ?? getDockItemPosition(getId());

    transform = calculateMinimizeTransform(
      posToStore,
      sizeToStore,
      target
    );

    minimizeCallback = onComplete || null;
    minimizeData = { position: posToStore, size: sizeToStore };

    modalEl.setAttribute('data-state', 'minimizing');
    modalEl.setAttribute('data-animation-phase', 'prepare');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animationType = 'minimize';
        isAnimating = true;
        modalEl.setAttribute('data-animation-phase', 'animate');
        emitter.emit('animationStart', { type: 'minimize' });
        notify();
      });
    });

    fallbackTimer = setTimeout(() => {
      if (animationType === 'minimize') {
        completeMinimize();
      }
    }, DURATIONS.minimize + TIMEOUT_SAFETY_MARGIN);

    return true;
  }

  function startRestore(storePosition: Position | undefined, modalSize: Dimensions | undefined) {
    const modalEl = getElement();

    setupListener();
    clearFallbackTimer();

    if (!areAnimationsEnabled()) {
      const modalPos = storePosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      setPosition(modalPos);
      setHasBeenDragged(true);
      return;
    }

    const target = getDockItemPosition(getId());
    const modalPos = storePosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const size = modalSize || { width: 480, height: 400 };

    setPosition(modalPos);
    setHasBeenDragged(true);

    transform = calculateRestoreTransform(modalPos, size, target);

    animationType = 'restore';
    isAnimating = true;

    if (modalEl) {
      modalEl.setAttribute('data-state', 'restoring');
      modalEl.setAttribute('data-animation-phase', 'animate');
    }

    emitter.emit('animationStart', { type: 'restore' });
    notify();

    fallbackTimer = setTimeout(() => {
      if (animationType === 'restore') {
        completeRestore();
      }
    }, DURATIONS.restore + TIMEOUT_SAFETY_MARGIN);
  }

  function startOpen(): boolean {
    const modalEl = getElement();
    if (!pendingOpenSource || !modalEl || isAnimating) return false;

    setupListener();
    clearFallbackTimer();

    if (!areAnimationsEnabled()) {
      pendingOpenSource = null;
      return false;
    }

    const sourcePos = pendingOpenSource;
    const rect = modalEl.getBoundingClientRect();

    const currentPos = getHasBeenDragged() ? getPosition() : { x: rect.left, y: rect.top };
    const modalWidth = rect.width;
    const modalHeight = rect.height;

    if (!getHasBeenDragged()) {
      setPosition(currentPos);
      setHasBeenDragged(true);
    }

    transform = calculateOpenTransform(
      currentPos,
      { width: modalWidth, height: modalHeight },
      sourcePos
    );

    animationType = 'open';
    isAnimating = true;
    pendingOpenSource = null;

    modalEl.setAttribute('data-state', 'opening');
    modalEl.setAttribute('data-animation-phase', 'animate');

    emitter.emit('animationStart', { type: 'open' });
    onOpenStart?.();
    notify();

    fallbackTimer = setTimeout(() => {
      if (animationType === 'open') {
        completeOpen();
      }
    }, DURATIONS.open + TIMEOUT_SAFETY_MARGIN);

    return true;
  }

  function startClose(onComplete: () => void): boolean {
    const modalEl = getElement();
    if (isAnimating) return false;

    setupListener();
    clearFallbackTimer();

    if (!areAnimationsEnabled()) {
      onComplete();
      return true;
    }

    closeCallback = onComplete;
    animationType = 'close';
    isAnimating = true;

    if (modalEl) {
      modalEl.setAttribute('data-state', 'closing');
      modalEl.setAttribute('data-animation-phase', 'animate');
    }

    emitter.emit('animationStart', { type: 'close' });
    notify();

    fallbackTimer = setTimeout(() => {
      if (animationType === 'close') {
        completeClose();
      }
    }, DURATIONS.close + TIMEOUT_SAFETY_MARGIN);

    return true;
  }

  function forceClearMinimize() {
    clearMinimizeTimer();
    clearFallbackTimer();
    if (animationType === 'minimize') {
      animationType = 'none';
      isAnimating = false;
      transform = null;
      minimizeCallback = null;
      minimizeData = null;
      notify();
    }
  }

  function destroy() {
    clearMinimizeTimer();
    clearFallbackTimer();
    cleanupAnimationListener?.();
    cleanupAnimationListener = null;
    emitter.off();
  }

  return {
    getState,
    isAnimating: () => isAnimating,
    getAnimationType: () => animationType,
    getTransform: () => transform ? { ...transform } : null,
    getPendingOpenSource: () => pendingOpenSource ? { ...pendingOpenSource } : null,
    setPendingOpenSource: (source) => { pendingOpenSource = source ? { ...source } : null; },
    startMinimize,
    startRestore,
    startOpen,
    startClose,
    forceClearMinimize,
    destroy,
    subscribe: (callback) => emitter.on('change', callback),
  };
}
