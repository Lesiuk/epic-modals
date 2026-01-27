import type {
  Position,
  Dimensions,
  ModalId,
  ModalGlow,
  ModalConfigOverrides,
  AnimationTransform,
} from '../types';
import type { ModalLibraryConfig, ModalConfigHelper } from '../config';

export interface ModalControllerOptions {

  id: ModalId;

  title: string;

  icon?: string;

  config?: ModalConfigOverrides;

  providerConfig?: Partial<ModalLibraryConfig>;

  maxWidth?: string;

  preferredHeight?: string;

  glow?: ModalGlow;

  closeOnEscape?: boolean;

  autoOpen?: boolean;

  openSourcePosition?: Position | null;

  onClose?: () => void;

  skipRegistration?: boolean;

  configHelper: ModalConfigHelper;
}

export type { ModalConfigHelper };

export interface ComputedModalState {

  position: Position;
  size: Dimensions;
  zIndex: number;

  isDragging: boolean;
  isResizing: boolean;
  hasBeenDragged: boolean;
  hasBeenResized: boolean;

  isMinimizing: boolean;
  isRestoring: boolean;
  isOpening: boolean;
  isClosing: boolean;
  isAnyAnimating: boolean;
  animationTransform: AnimationTransform | null;

  isVisible: boolean;
  showCentered: boolean;
  isAwaitingRestore: boolean;
  isAwaitingChildOpen: boolean;
  isVisibleByAnimation: boolean;

  hasChild: boolean;
  isChildModal: boolean;
  showOverlay: boolean;

  isTransparent: boolean;
  isAttentionAnimating: boolean;
  glowStabilizing: boolean;

  isAnimatingPosition: boolean;
  isAnimatingToCenter: boolean;
  wasRestored: boolean;
  overlayClosing: boolean;

  glowEnabled: boolean;
  draggable: boolean;
  resizable: boolean;
  minimizable: boolean;

  dataState: string;
  dataAnimationPhase: string;

  style: Record<string, string | number>;
  cssClasses: string[];
}

export interface ModalControllerEvents {
  stateChange: ComputedModalState;
  close: void;
}
