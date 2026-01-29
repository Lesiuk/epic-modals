import type { ModalId, Position } from '../types';
import type { DragBehavior } from '../behaviors/drag';
import type { ResizeBehavior } from '../behaviors/resize';
import type { AnimationController } from '../animation/controller';
import {
  getModalState,
  updateModal,
  finalizeModalClose,
  unhideChildModal,
  resetModalTransparency,
  clearPositionAnimation,
  finalizeChildMinimize,
  triggerCascadingParentAnimations,
} from '../state';
import { pending } from '../state/pending-factory';
import {
  activeAttention,
  setActiveAttention,
  setPendingMinimizeTarget,
  openSourcePositions,
  pendingParentLink,
  setPendingParentLink,
  pendingParentAnimations,
} from '../state/store';
import { DURATIONS, TIMEOUT_SAFETY_MARGIN } from '../animation/timing';
import { flipAnimate } from '../animation/flip';
import { whenHasDimensions } from '../utils/dom';

export type ModalPhase =
  | 'idle'
  | 'opening'
  | 'open'
  | 'minimizing'
  | 'minimized'
  | 'restoring'
  | 'closing';

interface ModalFlags {
  isAttentionAnimating: boolean;
  glowStabilizing: boolean;
  wasRestored: boolean;
  isAnimatingToCenter: boolean;
  restoreHold: boolean;
}

interface ParentAnimationState {
  inFlight: boolean;
  startTime: number;
  deferredTarget: Position | null;
  cancelCleanup: (() => void) | null;
}

export interface StateManagerPositioning {
  centerChildOnParent: (parentId: ModalId) => boolean;
  scheduleCenterChildOnParent: (parentId: ModalId) => void;
  applySmartPositioning: () => void;
  scheduleSmartPositioning: () => void;
}

export interface ModalStateManagerOptions {

  id: ModalId;

  options: {
    glow?: unknown;
    openSourcePosition?: Position | null;
    onClose?: () => void;
  };

  getDragBehavior: () => DragBehavior;

  getResizeBehavior: () => ResizeBehavior;

  getAnimationController: () => AnimationController;

  getElement: () => HTMLElement | null;

  getPositioning: () => StateManagerPositioning;

  onStateChange: () => void;

  focusFirst: () => void;
}

export class ModalStateManager {
  private id: ModalId;
  private options: ModalStateManagerOptions;

  private _phase: ModalPhase = 'idle';

  private _flags: ModalFlags = {
    isAttentionAnimating: false,
    glowStabilizing: false,
    wasRestored: false,
    isAnimatingToCenter: false,
    restoreHold: false,
  };

  private _parentAnimation: ParentAnimationState = {
    inFlight: false,
    startTime: 0,
    deferredTarget: null,
    cancelCleanup: null,
  };

  private _isHandlingPendingStates = false;

  constructor(options: ModalStateManagerOptions) {
    this.id = options.id;
    this.options = options;
  }

  private setPhase(newPhase: ModalPhase): void {

    if (import.meta.env.DEV) {
      const validTransitions: Record<ModalPhase, ModalPhase[]> = {
        'idle': ['opening', 'minimizing', 'closing', 'open', 'restoring'],
        'opening': ['open', 'closing', 'idle', 'minimizing'],
        'open': ['minimizing', 'closing', 'idle', 'restoring'],
        'minimizing': ['minimized', 'closing', 'idle'],
        'minimized': ['restoring', 'closing', 'idle'],
        'restoring': ['open', 'closing', 'idle', 'minimizing'],
        'closing': ['idle'],
      };

      if (!validTransitions[this._phase].includes(newPhase)) {
        console.warn(`[StateManager] Unexpected phase transition: ${this._phase} → ${newPhase}`);
      }
    }

    this._phase = newPhase;
  }

  get phase(): ModalPhase {
    return this._phase;
  }

  handlePendingStates(): void {

    if (this._isHandlingPendingStates) {
      return;
    }

    const state = getModalState(this.id);
    if (!state) return;

    this._isHandlingPendingStates = true;
    try {

      if (this.handlePendingForceClose()) return;
      this.handlePendingMinimize();
      this.handlePendingMinimizeWithParent();
      this.handlePendingRestore();
      this.handlePendingChildRestore();
      if (this.handlePendingClose()) return;

      const link = this.handlePendingParentLink();
      const hadSourcePosition = this.handlePendingOpen(link);
      this.handlePendingAttention();
      this.handlePendingParentAnimation();
      this.handleChildCentering(link, hadSourcePosition);
    } finally {
      this._isHandlingPendingStates = false;
    }
  }

  private handlePendingForceClose(): boolean {
    if (!pending.has('forceClose', this.id)) return false;

    pending.consume('forceClose', this.id);
    finalizeModalClose(this.id);
    this.options.options.onClose?.();
    return true;
  }

  private handlePendingMinimize(): void {
    if (!pending.has('minimize', this.id) || this._phase === 'minimizing') return;

    this.setPhase('minimizing');

    setPendingMinimizeTarget(null);

    const element = this.options.getElement();
    if (element) {
      const drag = this.options.getDragBehavior();
      const resize = this.options.getResizeBehavior();
      const rect = element.getBoundingClientRect();

      const posToStore = drag.hasBeenDragged()
        ? drag.getPosition()
        : { x: rect.left, y: rect.top };
      const sizeToStore = resize.hasBeenResized()
        ? resize.getSize()
        : { width: rect.width, height: rect.height };

      updateModal(this.id, {
        position: posToStore,
        size: sizeToStore,
        hasBeenDragged: true,
      });
    }

    const animation = this.options.getAnimationController();
    const started = animation.startMinimize(undefined, () => {
      pending.consume('minimize', this.id);
      this.setPhase('minimized');
    });

    if (!started) {

      this.setPhase('open');
    }
  }

  private handlePendingMinimizeWithParent(): void {
    if (!pending.has('minimizeWithParent', this.id) || this._phase === 'minimizing') return;

    this.setPhase('minimizing');

    const element = this.options.getElement();
    if (element) {
      const drag = this.options.getDragBehavior();
      const resize = this.options.getResizeBehavior();
      const rect = element.getBoundingClientRect();

      const posToStore = drag.hasBeenDragged()
        ? drag.getPosition()
        : { x: rect.left, y: rect.top };
      const sizeToStore = resize.hasBeenResized()
        ? resize.getSize()
        : { width: rect.width, height: rect.height };

      updateModal(this.id, {
        position: posToStore,
        size: sizeToStore,
        hasBeenDragged: true,
      });
    }

    const animation = this.options.getAnimationController();
    const started = animation.startMinimize(undefined, () => {
      pending.consume('minimizeWithParent', this.id);
      finalizeChildMinimize(this.id);
      this.setPhase('minimized');
    });

    if (!started) {

      this.setPhase('open');
    }
  }

  private handlePendingRestore(): void {
    if (!pending.has('restore', this.id)) return;

    const modalState = getModalState(this.id);
    const animation = this.options.getAnimationController();

    pending.consume('restore', this.id);
    this.setPhase('restoring');

    animation.startRestore(
      modalState?.position ?? undefined,
      modalState?.size ?? undefined
    );

    requestAnimationFrame(() => {
      this.options.focusFirst();
    });
  }

  private handlePendingChildRestore(): void {
    if (!pending.has('childRestore', this.id)) return;

    const modalState = getModalState(this.id);
    const animation = this.options.getAnimationController();

    pending.consume('childRestore', this.id);
    this.setPhase('restoring');

    animation.startRestore(
      modalState?.position ?? undefined,
      modalState?.size ?? undefined
    );
    unhideChildModal(this.id);
    this._flags.wasRestored = true;
  }

  private handlePendingClose(): boolean {
    if (!pending.has('close', this.id)) return false;

    pending.consume('close', this.id);
    this.setPhase('closing');
    const animation = this.options.getAnimationController();

    const started = animation.startClose(() => {
      resetModalTransparency(this.id);
      finalizeModalClose(this.id);
      this.setPhase('idle');
      this.options.options.onClose?.();
    });

    if (!started) {
      resetModalTransparency(this.id);
      finalizeModalClose(this.id);
      this.setPhase('idle');
      this.options.options.onClose?.();
    }

    return true;
  }

  private handlePendingParentLink(): { parentId: ModalId; childId: ModalId } | null {
    const link = pendingParentLink;
    if (link && link.childId === this.id) {
      updateModal(this.id, { parentId: link.parentId });
      this._flags.wasRestored = true;
    }

    if (this.id && link?.childId !== this.id) {
      return null;
    }
    setPendingParentLink(null);
    return link;
  }

  private handlePendingOpen(link: { parentId: ModalId; childId: ModalId } | null): boolean {
    if (!pending.has('open', this.id)) return false;

    pending.consume('open', this.id);
    this.setPhase('opening');

    const drag = this.options.getDragBehavior();
    const resize = this.options.getResizeBehavior();

    updateModal(this.id, { position: null, hasBeenDragged: false, size: null });
    drag.setPosition({ x: 0, y: 0 });
    drag.setHasBeenDragged(false);
    resize.reset();

    const storedSourcePos = openSourcePositions.get(this.id) ?? null;
    openSourcePositions.delete(this.id);

    const sourcePos =
      storedSourcePos ||
      this.options.options.openSourcePosition ||
      null;

    const isChildModalNow = !!link || !!getModalState(this.id)?.parentId;
    let hadSourcePosition = false;

    if (sourcePos) {
      hadSourcePosition = true;
      const animation = this.options.getAnimationController();
      animation.setPendingOpenSource(sourcePos);

      if (isChildModalNow && link) {
        this.openChildModalWithAnimation(link.parentId);
      } else {
        this.openStandaloneModalWithAnimation();
      }
    } else if (!isChildModalNow) {
      this.options.getPositioning().scheduleSmartPositioning();
      this.setPhase('open');
    }

    requestAnimationFrame(() => {
      this.options.focusFirst();
    });

    return hadSourcePosition;
  }

  private openChildModalWithAnimation(parentId: ModalId): void {
    const positioning = this.options.getPositioning();
    const animation = this.options.getAnimationController();

    whenHasDimensions(() => this.options.getElement())
      .then(() => {
        const centered = positioning.centerChildOnParent(parentId);
        if (centered) {
          animation.startOpen();
          this._flags.wasRestored = true;
          this.setPhase('open');
        }
      })
      .catch(() => {
        const centered = positioning.centerChildOnParent(parentId);
        if (centered) {
          animation.startOpen();
          this._flags.wasRestored = true;
          this.setPhase('open');
        }
      });
  }

  private openStandaloneModalWithAnimation(): void {
    const positioning = this.options.getPositioning();
    const animation = this.options.getAnimationController();

    whenHasDimensions(() => this.options.getElement())
      .then(() => {
        positioning.applySmartPositioning();
        animation.startOpen();
        this.setPhase('open');
      })
      .catch(() => {
        positioning.applySmartPositioning();
        animation.startOpen();
        this.setPhase('open');
      });
  }

  private handlePendingAttention(): void {
    if (!pending.has('attention', this.id)) return;

    pending.consume('attention', this.id);

    if (!activeAttention.includes(this.id)) {
      setActiveAttention([...activeAttention, this.id]);
    }
    this._flags.isAttentionAnimating = true;

    setTimeout(() => {
      this._flags.isAttentionAnimating = false;
      this.options.onStateChange();
    }, 600);
  }

  private handlePendingParentAnimation(): void {
    if (!pendingParentAnimations.has(this.id)) return;

    const targetPosition = pendingParentAnimations.get(this.id) ?? null;
    pendingParentAnimations.delete(this.id);
    if (!targetPosition) return;

    if (this._parentAnimation.inFlight) {
      const elapsed = Date.now() - this._parentAnimation.startTime;
      if (elapsed < DURATIONS.parentRetargetInterval) {

        this._parentAnimation.deferredTarget = targetPosition;
        return;
      }

    }

    this._parentAnimation.deferredTarget = null;
    this.startParentFlip(targetPosition);
  }

  private startParentFlip(targetPosition: Position): void {
    const drag = this.options.getDragBehavior();
    const element = this.options.getElement();

    const rect = element?.getBoundingClientRect();
    const oldPosition = rect ? {
      x: rect.left,
      y: rect.top,
    } : (getModalState(this.id)?.position ?? null);

    updateModal(this.id, {
      position: targetPosition,
      hasBeenDragged: true,
      isAnimatingPosition: true,
    });

    drag.setPosition(targetPosition);
    drag.setHasBeenDragged(true);

    this._parentAnimation.cancelCleanup?.();
    this._parentAnimation.inFlight = true;
    this._parentAnimation.startTime = Date.now();
    const id = this.id;

    const onComplete = () => {
      this._parentAnimation.inFlight = false;
      this._parentAnimation.cancelCleanup = null;
      clearPositionAnimation(id);

      const deferred = this._parentAnimation.deferredTarget;
      if (deferred) {
        this._parentAnimation.deferredTarget = null;
        this.startParentFlip(deferred);
      } else {
        triggerCascadingParentAnimations(id);
      }
    };

    if (element && oldPosition) {
      this._parentAnimation.cancelCleanup = flipAnimate(element, oldPosition, targetPosition, {
        duration: DURATIONS.parentMove,
        onComplete,
      });
    } else {

      setTimeout(onComplete, DURATIONS.parentMove + TIMEOUT_SAFETY_MARGIN);
    }
  }

  private handleChildCentering(
    link: { parentId: ModalId; childId: ModalId } | null,
    hadSourcePosition: boolean
  ): void {
    if (link && this.options.getElement() && !hadSourcePosition) {
      this.options.getPositioning().scheduleCenterChildOnParent(link.parentId);
    }
  }

  get wasRestored(): boolean {
    return this._flags.wasRestored;
  }

  set wasRestored(value: boolean) {
    this._flags.wasRestored = value;
  }

  get isAttentionAnimating(): boolean {
    return this._flags.isAttentionAnimating;
  }

  get glowStabilizing(): boolean {
    return this._flags.glowStabilizing;
  }

  set glowStabilizing(value: boolean) {
    this._flags.glowStabilizing = value;
  }

  get restoreHold(): boolean {
    return this._flags.restoreHold;
  }

  set restoreHold(value: boolean) {
    this._flags.restoreHold = value;
  }

  get isAnimatingToCenter(): boolean {
    return this._flags.isAnimatingToCenter;
  }

  set isAnimatingToCenter(value: boolean) {
    this._flags.isAnimatingToCenter = value;
  }

  get isHandlingMinimize(): boolean {
    return this._phase === 'minimizing';
  }
}
