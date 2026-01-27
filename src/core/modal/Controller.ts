import type { Position, Dimensions, ModalId } from '../types';
import { computeStyle, computeCssClasses } from './Styling';
import { ModalLifecycle } from './Lifecycle';
import { createDragBehavior, type DragBehavior } from '../behaviors/drag';
import { createResizeBehavior, type ResizeBehavior, type ResizeDirection } from '../behaviors/resize';
import { createAnimationController, type AnimationController } from '../animation/controller';
import { ModalPositioning } from './Positioning';
import { ModalInteractions } from './Interactions';
import { ModalStateManager } from './StateManager';
import { createEventEmitter } from '../state/events';
import { toDataId, getModalDialogElement } from '../utils/helpers';
import {
  getModalState,
  updateModal,
  closeModal,
  minimizeModal,
  bringToFront,
  updateModalPosition,
  isTopModal,
  hasPendingMinimize,
  hasPendingMinimizeWithParent,
  hasPendingForceClose,
  consumePendingForceClose,
  hasPendingClose,
  hasPendingRestore,
  hasPendingChildRestore,
  toggleModalTransparency,
  hasPendingParentLinkFor,
  triggerCascadingParentAnimations,
  subscribe as subscribeToState,
  registerModal,
} from '../state';
import { getConfig } from '../config';
import { flipAnimate } from '../animation/flip';
import { DURATIONS } from '../animation/timing';

export type {
  ModalControllerOptions,
  ComputedModalState,
  ModalControllerEvents,
  ModalConfigHelper,
} from './Controller.types';

import type {
  ModalControllerOptions,
  ComputedModalState,
  ModalControllerEvents,
} from './Controller.types';

export class ModalController {
  private id: ModalId;
  private dataId: string;
  private options: ModalControllerOptions;

  private drag: DragBehavior;
  private resize: ResizeBehavior;
  private animation: AnimationController;
  private positioning: ModalPositioning;
  private lifecycle: ModalLifecycle;
  private interactions: ModalInteractions;
  private stateManager!: ModalStateManager;

  private overlayClosing = false;

  private emitter = createEventEmitter<ModalControllerEvents>();

  private unsubscribeState: (() => void) | null = null;

  private cachedState: ComputedModalState | null = null;

  constructor(options: ModalControllerOptions) {
    this.id = options.id;
    this.dataId = toDataId(options.id);
    this.options = options;

    this.drag = createDragBehavior({
      initialPosition: { x: 0, y: 0 },
      constrain: true,
    });

    this.resize = createResizeBehavior({
      minWidth: options.config?.appearance?.minWidth ?? getConfig().appearance.minWidth,
      minHeight: options.config?.appearance?.minHeight ?? getConfig().appearance.minHeight,
      getPosition: () => this.drag.getPosition(),
      setPosition: (pos) => this.drag.setPosition(pos),
      getHasBeenDragged: () => this.drag.hasBeenDragged(),
      setHasBeenDragged: (val) => this.drag.setHasBeenDragged(val),
      getElement: () => this.element,
      onResizeEnd: (position, size) => this.handleResizeEnd(position, size),
    });

    this.animation = createAnimationController({
      getId: () => this.id,
      getElement: () => this.element,
      getPosition: () => this.drag.getPosition(),
      setPosition: (pos) => this.drag.setPosition(pos),
      getHasBeenDragged: () => this.drag.hasBeenDragged(),
      setHasBeenDragged: (val) => this.drag.setHasBeenDragged(val),
      getHasBeenResized: () => this.resize.hasBeenResized(),
      getSize: () => this.resize.getSize(),
      areAnimationsEnabled: () => this.options.configHelper.isFeatureEnabled('animations'),
      onMinimizeComplete: (position, hasBeenDragged, size) => {
        updateModal(this.id, { position, size, hasBeenDragged });
        minimizeModal(this.id);
      },
      onOpenStart: () => {
        const state = getModalState(this.id);
        if (state?.parentId) {
          this.stateManager.wasRestored = true;
        }
      },
    });

    this.positioning = new ModalPositioning({
      id: this.id,
      dataId: this.dataId,
      configHelper: options.configHelper,
      getDragBehavior: () => this.drag,
      getElement: () => this.element,
    });

    this.interactions = new ModalInteractions({
      id: this.id,
      configHelper: options.configHelper,
      getDragBehavior: () => this.drag,
      getResizeBehavior: () => this.resize,
      getElement: () => this.element,
      getState: () => ({ hasChild: !!getModalState(this.id)?.childId }),
      onDragMove: () => {
        if (getConfig().parentChild.movementMode === 'realtime') {
          const position = this.drag.getPosition();
          updateModalPosition(this.id, position, { drag: true, realtime: true });
        }
      },
      onDragEnd: () => {
        const position = this.drag.getPosition();
        updateModalPosition(this.id, position, { drag: true });
        if (getConfig().parentChild.movementMode === 'animated') {
          triggerCascadingParentAnimations(this.id);
        }
      },
      onClose: () => this.close(),
      closeOnEscape: options.closeOnEscape,
      isTopModal: () => isTopModal(this.id),
    });

    this.stateManager = new ModalStateManager({
      id: this.id,
      options: {
        glow: options.glow,
        openSourcePosition: options.openSourcePosition,
        onClose: options.onClose,
      },
      getDragBehavior: () => this.drag,
      getResizeBehavior: () => this.resize,
      getAnimationController: () => this.animation,
      getElement: () => this.element,
      getPositioning: () => this.positioning,
      onStateChange: () => this.notifyStateChange(),
      focusFirst: () => this.interactions.focusFirst(),
    });

    if (hasPendingParentLinkFor(options.id)) {
      this.stateManager.wasRestored = true;
    }

    this.lifecycle = new ModalLifecycle({
      onMount: () => {
        this.handleStateChange();
        this.handlePendingStates();
        this.notifyStateChange();
      },
      onDestroy: () => {
        this.unsubscribeState?.();
        this.drag.destroy();
        this.resize.destroy();
        this.animation.destroy();
        this.emitter.off();
      },
      onWindowResize: () => this.handleWindowResize(),
    });

    this.drag.subscribe(() => this.notifyStateChange());
    this.resize.subscribe(() => this.notifyStateChange());
    this.animation.subscribe(() => {

      this.handlePendingStates();
      this.notifyStateChange();
    });

    this.unsubscribeState = subscribeToState(() => {
      this.handleStateChange();
      this.handlePendingStates();
      this.notifyStateChange();
    });

    if (!options.skipRegistration) {
      this.register(options.autoOpen ?? false);
    }

    this.handleStateChange();
    this.handlePendingStates();
  }

  mount(element: HTMLElement): void {
    this.lifecycle.mount(element);
  }

  destroy(): void {
    this.lifecycle.destroy();
  }

  private get element(): HTMLElement | null {
    return this.lifecycle.getElement();
  }

  private handleWindowResize(): void {
    if (!this.element || !this.drag.hasBeenDragged()) return;

    const size = this.resize.hasBeenResized() ? this.resize.getSize() : {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
    };

    this.positioning.constrainToViewport(size);

    if (this.resize.hasBeenResized()) {
      this.resize.constrainToViewport();
    }

    this.notifyStateChange();
  }

  private register(shouldOpen: boolean): void {
    registerModal({
      id: this.id,
      title: this.options.title,
      icon: this.options.icon ?? '',
      isOpen: shouldOpen,
      isMinimized: false,
      isHiddenWithParent: false,
      isTransparent: false,
      isRejected: false,
      position: null,
      size: null,
      hasBeenDragged: false,
      dockPosition: 0,
      glow: this.options.glow ?? null,
      parentId: undefined,
      childId: undefined,
      offsetFromParent: undefined,
    });

    if (shouldOpen) {
      bringToFront(this.id);
    }
  }

  getState(): ComputedModalState {
    if (this.cachedState) {
      return this.cachedState;
    }

    const modalState = getModalState(this.id);
    const dragState = this.drag.getState();
    const resizeState = this.resize.getState();
    const animState = this.animation.getState();

    const isVisible = modalState
      ? (modalState.isOpen || hasPendingClose(this.id)) &&
        (!modalState.isMinimized || hasPendingMinimize(this.id)) &&
        (!modalState.isHiddenWithParent ||
          hasPendingMinimizeWithParent(this.id) ||
          hasPendingChildRestore(this.id))
      : false;

    const hasChild = !!modalState?.childId;
    const isChildModal = !!modalState?.parentId;

    const isMinimizing = animState.type === 'minimize' && animState.isAnimating;
    const isRestoring = animState.type === 'restore' && animState.isAnimating;
    const isOpening = animState.type === 'open' && animState.isAnimating;
    const isClosing = animState.type === 'close' && animState.isAnimating;
    const isAnyAnimating = animState.isAnimating;

    const isAnimatingPosition = modalState?.isAnimatingPosition ?? false;
    const effectivePosition = isAnimatingPosition && modalState?.position
      ? modalState.position
      : dragState.position;
    const effectiveHasBeenDragged = isAnimatingPosition
      ? true
      : dragState.hasBeenDragged;

    const isAwaitingRestore =
      (hasPendingChildRestore(this.id) || hasPendingRestore(this.id)) && !isRestoring;

    const isAwaitingChildOpen =
      (isChildModal || hasPendingParentLinkFor(this.id)) &&
      !isOpening &&
      (!effectiveHasBeenDragged || !!this.animation.getPendingOpenSource());

    const isVisibleByAnimation = isRestoring || isOpening || this.stateManager.restoreHold;

    const showCentered =
      isVisible &&
      !effectiveHasBeenDragged &&
      !isAnyAnimating &&
      !this.animation.getPendingOpenSource() &&
      !isAwaitingRestore &&
      !isAwaitingChildOpen;

    let dataState = 'closed';
    if (isMinimizing) dataState = 'minimizing';
    else if (isRestoring) dataState = 'restoring';
    else if (isOpening) dataState = 'opening';
    else if (isClosing) dataState = 'closing';
    else if (modalState?.isMinimized) dataState = 'minimized';
    else if (isVisible) dataState = 'open';

    const draggable = this.options.configHelper.isFeatureEnabled('drag');
    const resizable = this.options.configHelper.isFeatureEnabled('resize');
    const minimizable = this.options.configHelper.isFeatureEnabled('minimize');
    const glowEnabled = !!this.options.glow;

    const style = computeStyle({
      position: effectivePosition,
      hasBeenDragged: effectiveHasBeenDragged,
      hasBeenResized: resizeState.hasBeenResized,
      size: resizeState.size,
      animationTransform: animState.transform,
      zIndex: modalState?.zIndex ?? 1000,
      glowEnabled,
      glow: this.options.glow ?? null,
      maxWidth: this.options.maxWidth,
      preferredHeight: this.options.preferredHeight,
      isAnimatingPosition,
    });

    const cssClasses = computeCssClasses({
      isDragging: dragState.isDragging,
      isResizing: resizeState.isResizing,
      hasBeenDragged: effectiveHasBeenDragged,
      isMinimizing,
      isRestoring,
      isOpening,
      isClosing,
      showCentered,
      isTransparent: modalState?.isTransparent ?? false,
      glowEnabled,
      hasChild,
      isChildModal,
      wasRestored: this.stateManager.wasRestored,
      isVisibleByAnimation,
      isAwaitingRestore,
      isAwaitingChildOpen,
      isAnimatingToCenter: this.stateManager.isAnimatingToCenter,
      isAnimatingPosition: modalState?.isAnimatingPosition ?? false,
      isAttentionAnimating: this.stateManager.isAttentionAnimating,
      glowStabilizing: this.stateManager.glowStabilizing,
    });

    this.cachedState = {
      position: dragState.position,
      size: resizeState.size,
      zIndex: modalState?.zIndex ?? 1000,

      isDragging: dragState.isDragging,
      isResizing: resizeState.isResizing,
      hasBeenDragged: dragState.hasBeenDragged,
      hasBeenResized: resizeState.hasBeenResized,

      isMinimizing,
      isRestoring,
      isOpening,
      isClosing,
      isAnyAnimating,
      animationTransform: animState.transform,

      isVisible,
      showCentered,
      isAwaitingRestore,
      isAwaitingChildOpen,
      isVisibleByAnimation,

      hasChild,
      isChildModal,
      showOverlay: hasChild || this.overlayClosing,

      isTransparent: modalState?.isTransparent ?? false,
      isAttentionAnimating: this.stateManager.isAttentionAnimating,
      glowStabilizing: this.stateManager.glowStabilizing,

      isAnimatingPosition: modalState?.isAnimatingPosition ?? false,
      isAnimatingToCenter: this.stateManager.isAnimatingToCenter,
      wasRestored: this.stateManager.wasRestored,
      overlayClosing: this.overlayClosing,

      glowEnabled,
      draggable,
      resizable,
      minimizable,

      dataState,
      dataAnimationPhase: animState.isAnimating ? 'animate' : 'idle',

      style,
      cssClasses,
    };

    return this.cachedState;
  }

  subscribe(callback: (state: ComputedModalState) => void): () => void {
    return this.emitter.on('stateChange', callback);
  }

  private notifyStateChange(): void {
    this.cachedState = null;
    this.emitter.emit('stateChange', this.getState());
  }

  startDrag(e: PointerEvent): void {
    this.interactions.startDrag(e);
  }

  startResize(e: PointerEvent, direction: ResizeDirection): void {
    this.interactions.startResize(e, direction);
  }

  handlePointerMove(e: PointerEvent): void {
    this.interactions.handlePointerMove(e);
  }

  handlePointerUp(e: PointerEvent): void {
    this.interactions.handlePointerUp(e);
  }

  handleKeyDown(e: KeyboardEvent): void {
    this.interactions.handleKeyDown(e);
  }

  handleTabKey(e: KeyboardEvent): void {
    this.interactions.handleTabKey(e);
  }

  minimize(): void {
    if (!this.options.configHelper.isFeatureEnabled('minimize')) return;
    minimizeModal(this.id);
  }

  close(): void {
    if (hasPendingForceClose(this.id)) {
      consumePendingForceClose(this.id);
    }
    closeModal(this.id);
    this.options.onClose?.();
  }

  toggleTransparency(): void {
    toggleModalTransparency(this.id);
  }

  bringToFront(): void {
    bringToFront(this.id);
  }

  setOpenSourcePosition(position: Position | null): void {
    this.animation.setPendingOpenSource(position);
  }

  updateGlow(glow: ModalControllerOptions['glow']): void {
    if (this.options.glow === glow) return;
    this.options.glow = glow;
    updateModal(this.id, { glow: glow ?? null });
    this.notifyStateChange();
  }

  focusFirst(): void {
    this.interactions.focusFirst();
  }

  private handleResizeEnd(position: Position, size: Dimensions): void {
    const state = getModalState(this.id);

    if (state?.parentId) {
      const parent = getModalState(state.parentId);
      const parentEl = getModalDialogElement(state.parentId);

      if (parent && parentEl) {
        const parentPos = parent.position ?? {
          x: parentEl.getBoundingClientRect().left,
          y: parentEl.getBoundingClientRect().top,
        };
        const parentSize = parent.size ?? {
          width: parentEl.offsetWidth,
          height: parentEl.offsetHeight,
        };

        const centeredPos = {
          x: parentPos.x + (parentSize.width - size.width) / 2,
          y: parentPos.y + (parentSize.height - size.height) / 2,
        };

        const oldPosition = position;

        this.stateManager.isAnimatingToCenter = true;
        this.drag.setPosition(centeredPos);

        const newOffset = {
          x: centeredPos.x - parentPos.x,
          y: centeredPos.y - parentPos.y,
        };

        updateModal(this.id, {
          position: centeredPos,
          size,
          hasBeenDragged: true,
          offsetFromParent: newOffset,
        });

        const element = this.lifecycle.getElement();
        if (element) {
          flipAnimate(element, oldPosition, centeredPos, {
            duration: DURATIONS.centerAfterResize,
            onComplete: () => {
              this.stateManager.isAnimatingToCenter = false;
            },
          });
        } else {
          this.stateManager.isAnimatingToCenter = false;
        }
        return;
      }
    }

    updateModal(this.id, { position, size, hasBeenDragged: true });
  }

  private handleStateChange(): void {
    const state = getModalState(this.id);
    if (!state) return;

    if (state.parentId || hasPendingParentLinkFor(this.id)) {
      this.stateManager.wasRestored = true;
    }

    if (
      !this.drag.isDragging() &&
      !this.resize.isResizing() &&
      state.position
    ) {
      const currentPos = this.drag.getPosition();
      const storePos = state.position;

      if (
        Math.abs(currentPos.x - storePos.x) > 0.5 ||
        Math.abs(currentPos.y - storePos.y) > 0.5
      ) {
        this.drag.setPosition(storePos);
        if (state.hasBeenDragged) {
          this.drag.setHasBeenDragged(true);
        }
      }
    }

    this.stateManager.handlePendingStates();
  }

  private handlePendingStates(): void {
    this.stateManager.handlePendingStates();
  }

  getId(): ModalId {
    return this.id;
  }

  getDataId(): string {
    return this.dataId;
  }

  getElement(): HTMLElement | null {
    return this.element;
  }
}

export function createModalController(
  options: ModalControllerOptions
): ModalController {
  return new ModalController(options);
}
