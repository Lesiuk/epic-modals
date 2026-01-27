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
  hasPendingOpen,
  consumePendingOpen,
  consumeOpenSourcePosition,
  hasPendingMinimize,
  consumePendingMinimize,
  consumePendingMinimizeTarget,
  hasPendingMinimizeWithParent,
  consumePendingMinimizeWithParent,
  finalizeChildMinimize,
  hasPendingForceClose,
  consumePendingForceClose,
  hasPendingClose,
  consumePendingClose,
  hasPendingRestore,
  consumePendingRestore,
  hasPendingChildRestore,
  consumePendingChildRestore,
  hasPendingAttention,
  consumePendingAttention,
  startAttentionAnimation,
  endAttentionAnimation,
  consumePendingParentLink,
  getPendingParentLink,
  hasPendingParentAnimation,
  consumePendingParentAnimation,
  triggerCascadingParentAnimations,
} from '../state';
import { DURATIONS, TIMEOUT_SAFETY_MARGIN } from '../animation/timing';
import { flipAnimate } from '../animation/flip';
import { whenHasDimensions } from '../utils/dom';

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

  private _isHandlingMinimize = false;
  private _isAttentionAnimating = false;
  private _wasRestored: boolean;
  private _glowStabilizing = false;
  private _restoreHold = false;
  private _isAnimatingToCenter = false;
  private _cancelParentAnimationCleanup: (() => void) | null = null;
  private _parentFlipInFlight = false;
  private _deferredParentTarget: Position | null = null;
  private _parentFlipStartTime = 0;

  constructor(options: ModalStateManagerOptions) {
    this.id = options.id;
    this.options = options;

    this._wasRestored = false;
  }

  handlePendingStates(): void {
    const state = getModalState(this.id);
    if (!state) return;

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
  }

  private handlePendingForceClose(): boolean {
    if (!hasPendingForceClose(this.id)) return false;

    consumePendingForceClose(this.id);
    finalizeModalClose(this.id);
    this.options.options.onClose?.();
    return true;
  }

  private handlePendingMinimize(): void {
    if (!hasPendingMinimize(this.id) || this._isHandlingMinimize) return;

    this._isHandlingMinimize = true;
    consumePendingMinimizeTarget();

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
      consumePendingMinimize(this.id);
      this._isHandlingMinimize = false;
    });

    if (!started) {

      this._isHandlingMinimize = false;
    }
  }

  private handlePendingMinimizeWithParent(): void {
    if (!hasPendingMinimizeWithParent(this.id) || this._isHandlingMinimize) return;

    this._isHandlingMinimize = true;

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
    animation.startMinimize(undefined, () => {
      consumePendingMinimizeWithParent(this.id);
      finalizeChildMinimize(this.id);
      this._isHandlingMinimize = false;
    });
  }

  private handlePendingRestore(): void {
    if (!hasPendingRestore(this.id)) return;

    const modalState = getModalState(this.id);
    const animation = this.options.getAnimationController();

    consumePendingRestore(this.id);

    animation.startRestore(
      modalState?.position ?? undefined,
      modalState?.size ?? undefined
    );

    requestAnimationFrame(() => {
      this.options.focusFirst();
    });
  }

  private handlePendingChildRestore(): void {
    if (!hasPendingChildRestore(this.id)) return;

    const modalState = getModalState(this.id);
    const animation = this.options.getAnimationController();

    consumePendingChildRestore(this.id);

    animation.startRestore(
      modalState?.position ?? undefined,
      modalState?.size ?? undefined
    );
    unhideChildModal(this.id);
    this._wasRestored = true;
  }

  private handlePendingClose(): boolean {
    if (!hasPendingClose(this.id)) return false;

    consumePendingClose(this.id);
    const animation = this.options.getAnimationController();

    const started = animation.startClose(() => {
      resetModalTransparency(this.id);
      finalizeModalClose(this.id);
      this.options.options.onClose?.();
    });

    if (!started) {
      resetModalTransparency(this.id);
      finalizeModalClose(this.id);
      this.options.options.onClose?.();
    }

    return true;
  }

  private handlePendingParentLink(): { parentId: ModalId; childId: ModalId } | null {
    const pendingLink = getPendingParentLink();
    if (pendingLink && pendingLink.childId === this.id) {
      updateModal(this.id, { parentId: pendingLink.parentId });
      this._wasRestored = true;
    }

    return consumePendingParentLink(this.id);
  }

  private handlePendingOpen(link: { parentId: ModalId; childId: ModalId } | null): boolean {
    if (!hasPendingOpen(this.id)) return false;

    consumePendingOpen(this.id);

    const drag = this.options.getDragBehavior();
    const resize = this.options.getResizeBehavior();

    updateModal(this.id, { position: null, hasBeenDragged: false, size: null });
    drag.setPosition({ x: 0, y: 0 });
    drag.setHasBeenDragged(false);
    resize.reset();

    const sourcePos =
      consumeOpenSourcePosition(this.id) ||
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
          this._wasRestored = true;
        }
      })
      .catch(() => {
        const centered = positioning.centerChildOnParent(parentId);
        if (centered) {
          animation.startOpen();
          this._wasRestored = true;
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
      })
      .catch(() => {
        positioning.applySmartPositioning();
        animation.startOpen();
      });
  }

  private handlePendingAttention(): void {
    if (!hasPendingAttention(this.id)) return;

    consumePendingAttention(this.id);
    startAttentionAnimation(this.id);
    this._isAttentionAnimating = true;

    setTimeout(() => {
      this._isAttentionAnimating = false;
      endAttentionAnimation(this.id);
      this.options.onStateChange();
    }, 600);
  }

  private handlePendingParentAnimation(): void {
    if (!hasPendingParentAnimation(this.id)) return;

    const targetPosition = consumePendingParentAnimation(this.id);
    if (!targetPosition) return;

    if (this._parentFlipInFlight) {
      const elapsed = Date.now() - this._parentFlipStartTime;
      if (elapsed < DURATIONS.parentRetargetInterval) {

        this._deferredParentTarget = targetPosition;
        return;
      }

    }

    this._deferredParentTarget = null;
    this.startParentFlip(targetPosition);
  }

  private startParentFlip(targetPosition: Position): void {
    const drag = this.options.getDragBehavior();
    const element = this.options.getElement();

    const oldPosition = element ? {
      x: element.getBoundingClientRect().left,
      y: element.getBoundingClientRect().top,
    } : (getModalState(this.id)?.position ?? null);

    updateModal(this.id, {
      position: targetPosition,
      hasBeenDragged: true,
      isAnimatingPosition: true,
    });

    drag.setPosition(targetPosition);
    drag.setHasBeenDragged(true);

    this._cancelParentAnimationCleanup?.();
    this._parentFlipInFlight = true;
    this._parentFlipStartTime = Date.now();
    const id = this.id;

    const onComplete = () => {
      this._parentFlipInFlight = false;
      this._cancelParentAnimationCleanup = null;
      clearPositionAnimation(id);

      const deferred = this._deferredParentTarget;
      if (deferred) {
        this._deferredParentTarget = null;
        this.startParentFlip(deferred);
      } else {
        triggerCascadingParentAnimations(id);
      }
    };

    if (element && oldPosition) {
      this._cancelParentAnimationCleanup = flipAnimate(element, oldPosition, targetPosition, {
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
    return this._wasRestored;
  }

  set wasRestored(value: boolean) {
    this._wasRestored = value;
  }

  get isAttentionAnimating(): boolean {
    return this._isAttentionAnimating;
  }

  get glowStabilizing(): boolean {
    return this._glowStabilizing;
  }

  set glowStabilizing(value: boolean) {
    this._glowStabilizing = value;
  }

  get restoreHold(): boolean {
    return this._restoreHold;
  }

  set restoreHold(value: boolean) {
    this._restoreHold = value;
  }

  get isAnimatingToCenter(): boolean {
    return this._isAnimatingToCenter;
  }

  set isAnimatingToCenter(value: boolean) {
    this._isAnimatingToCenter = value;
  }

  get isHandlingMinimize(): boolean {
    return this._isHandlingMinimize;
  }
}
