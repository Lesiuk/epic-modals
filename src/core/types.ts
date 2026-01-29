export type ModalId = string | symbol;

export interface Position {

  x: number;

  y: number;
}

export interface Dimensions {

  width: number;

  height: number;
}

export interface Bounds extends Position, Dimensions {}

export interface ModalGlow {
  color: string;
  intensity: 'minimum' | 'low' | 'medium' | 'high';
}

export interface ModalState {
  id: ModalId;
  title: string;
  icon: string;
  iconBadge?: string;
  isOpen: boolean;
  isMinimized: boolean;
  isHiddenWithParent: boolean;
  isTransparent: boolean;
  isAnimating: boolean;
  isAnimatingPosition?: boolean;
  isRejected: boolean;
  zIndex: number;
  position: Position | null;
  size: Dimensions | null;
  hasBeenDragged: boolean;
  dockPosition: number;
  glow: ModalGlow | null;
  content?: unknown;
  contentBg?: string;
  parentId?: ModalId;
  childId?: ModalId;
  offsetFromParent?: Position;
  lastChildId?: ModalId;
}

export interface AnimationTransform {
  x: number;
  y: number;
  originX: number;
  originY: number;
}

export type DockPosition = 'left' | 'right' | 'bottom' | 'free';
export type DockOrientation = 'horizontal' | 'vertical';
export type DockLabelMode = 'hidden' | 'beside' | 'below';

export type HeaderLayout = 'macos' | 'windows' | 'none';

export type StackingLayerName = 'BASE' | 'DROPDOWN' | 'STICKY' | 'OVERLAY' | 'MODAL' | 'DOCK' | 'TOAST';

export interface BackdropConfig {

  visible: boolean;

  blockClicks: boolean;
}

export interface ModalFeatures {
  dock: boolean;
  minimize: boolean;
  transparency: boolean;
  resize: boolean;
  drag: boolean;
  focusTrap: boolean;
  animations: boolean;

  backdrop: boolean | BackdropConfig;
  parentChild: boolean;
}

export interface AppearanceConfig {
  headerLayout: HeaderLayout;
  defaultWidth: string;
  defaultHeight: string;
  minWidth: number;
  minHeight: number;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ModalFeaturesOverride {
  dock?: boolean;
  minimize?: boolean;
  transparency?: boolean;
  resize?: boolean;
  drag?: boolean;
  focusTrap?: boolean;
  animations?: boolean;
  backdrop?: boolean | BackdropConfig;
  parentChild?: boolean;
}

export interface AppearanceOverride {
  headerLayout?: HeaderLayout;
  defaultWidth?: string;
  defaultHeight?: string;
  minWidth?: number;
  minHeight?: number;
}

export interface AnimationOverride {
  open?: number;
  close?: number;
  minimize?: number;
  restore?: number;
  easing?: string;
}

export interface PositioningOverride {
  strategy?: 'centered' | 'smart';
  modalGap?: number;
  avoidElements?: string[];
}

export interface ParentChildOverride {
  movementMode?: 'realtime' | 'animated';
  animationDuration?: number;
}

export interface ModalConfigOverrides {
  features?: ModalFeaturesOverride;
  appearance?: AppearanceOverride;
  animations?: AnimationOverride;
  positioning?: PositioningOverride;
  parentChild?: ParentChildOverride;
}

export type ModalAnimationState =
  | 'closed'
  | 'opening'
  | 'open'
  | 'closing'
  | 'minimizing'
  | 'minimized'
  | 'restoring';

export type AnimationPhase =
  | 'idle'
  | 'prepare'
  | 'animate'
  | 'complete';

export interface BaseModalProps {

  id: ModalId;

  title: string;

  icon?: string;

  description?: string;

  maxWidth?: string;

  preferredHeight?: string;

  autoOpen?: boolean;

  openSourcePosition?: Position | null;

  glow?: ModalGlow;

  config?: ModalConfigOverrides;

  closeOnEscape?: boolean;

  onClose?: () => void;
}

export interface ExternalElementProps {

  bodyElement?: HTMLElement | null;

  footerElement?: HTMLElement | null;

  iconElement?: HTMLElement | null;
}

export interface ModalHeaderBaseProps {
  title: string;

  icon?: string;
  isTransparent?: boolean;
  titleId?: string;
  headerLayout?: HeaderLayout;
  minimizable?: boolean;
  minimizeDisabled?: boolean;
  transparencyEnabled?: boolean;
}
