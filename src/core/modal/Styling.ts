import type { Position, Dimensions, ModalGlow, AnimationTransform } from '../types';

export interface ComputeStyleInput {
  position: Position;
  hasBeenDragged: boolean;
  hasBeenResized: boolean;
  size: Dimensions;
  animationTransform: AnimationTransform | null;
  zIndex: number;
  glowEnabled: boolean;
  glow: ModalGlow | null;
  maxWidth: string | undefined;
  preferredHeight: string | undefined;

  isAnimatingPosition?: boolean;
}

export interface ComputeCssClassesInput {
  isDragging: boolean;
  isResizing: boolean;
  hasBeenDragged: boolean;
  isMinimizing: boolean;
  isRestoring: boolean;
  isOpening: boolean;
  isClosing: boolean;
  showCentered: boolean;
  isTransparent: boolean;
  glowEnabled: boolean;
  hasChild: boolean;
  isChildModal: boolean;
  wasRestored: boolean;
  isVisibleByAnimation: boolean;
  isAwaitingRestore: boolean;
  isAwaitingChildOpen: boolean;
  isAnimatingToCenter: boolean;
  isAnimatingPosition: boolean;
  isAttentionAnimating: boolean;
  glowStabilizing: boolean;
}

export function computeStyle(input: ComputeStyleInput): Record<string, string | number> {
  const style: Record<string, string | number> = {
    'z-index': input.zIndex,
  };

  if (input.animationTransform) {
    style.left = `${input.position.x}px`;
    style.top = `${input.position.y}px`;
    style['--genie-origin-x'] = `${input.animationTransform.originX}px`;
    style['--genie-origin-y'] = `${input.animationTransform.originY}px`;
    style['--genie-translate-x'] = `${input.animationTransform.x}px`;
    style['--genie-translate-y'] = `${input.animationTransform.y}px`;
  } else if (input.hasBeenDragged) {
    style.left = `${input.position.x}px`;
    style.top = `${input.position.y}px`;

    if (!input.isAnimatingPosition) {
      style.transform = 'none';
    }
  }

  if (input.hasBeenResized) {
    style.width = `${input.size.width}px`;
    style.height = `${input.size.height}px`;
    style['max-width'] = 'none';
    style['max-height'] = 'none';
  } else {
    if (input.preferredHeight) {
      style['min-height'] = input.preferredHeight;
    }
    if (input.maxWidth) {
      style['max-width'] = input.maxWidth;
    }
  }

  if (input.glowEnabled && input.glow) {
    style['--modal-glow-color'] = input.glow.color;
    style['--modal-glow-intensity'] = String(input.glow.intensity ?? 'medium');
  }

  return style;
}

export function computeCssClasses(input: ComputeCssClassesInput): string[] {
  const classes = ['modal-dialog'];

  if (input.isDragging) classes.push('modal-dragging');
  if (input.isResizing) classes.push('modal-resizing');
  if (input.hasBeenDragged) classes.push('modal-positioned');
  if (input.isMinimizing) classes.push('modal-minimizing');
  if (input.isRestoring) classes.push('modal-restoring');
  if (input.isOpening) classes.push('modal-opening');
  if (input.isClosing) classes.push('modal-closing');
  if (input.showCentered) classes.push('modal-centered');
  if (!input.isTransparent) classes.push('modal-solid');
  if (input.isTransparent) classes.push('modal-transparent');
  if (input.glowEnabled) classes.push('modal-glow');
  if (input.hasChild) classes.push('modal-has-child');
  if (input.isChildModal) classes.push('modal-is-child');
  if (input.wasRestored) classes.push('modal-was-restored');
  if (input.isVisibleByAnimation) classes.push('modal-visible-by-animation');
  if (input.isAwaitingRestore) classes.push('modal-awaiting-restore');
  if (input.isAwaitingChildOpen) classes.push('modal-awaiting-child-open');
  if (input.isAnimatingToCenter) classes.push('modal-animating-to-center');
  if (input.isAnimatingPosition) classes.push('modal-animating-position');
  if (input.isAttentionAnimating) classes.push('modal-attention');
  if (input.glowStabilizing && input.glowEnabled) classes.push('modal-glow-stabilizing');

  return classes;
}
