import { Component, Snippet } from 'svelte';
import type {
  BaseModalProps,
  ExternalElementProps,
  ModalId,
  ModalGlow,
  ModalConfigOverrides,
  Position,
  DeepPartial,
  ModalLibraryConfig,
} from './index';

export interface ModalOperations {
  open: (sourceElement: HTMLElement) => void;
  close: () => void;
  minimize: () => void;
  restore: () => void;
  openChild: (childId: ModalId, sourceElement?: HTMLElement) => void;
  shake: () => void;
  bringToFront: () => void;
}

export type WizardTransitionStyle = 'fade-slide' | 'slide-through';

export interface WizardControls {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  progress: number;
  steps: Array<{ title: string }>;
  next: () => void;
  back: () => void;
  goToStep: (index: number) => void;
}

export interface ModalProps extends BaseModalProps, ExternalElementProps {
  customIcon?: Snippet;
  children?: Snippet;
  footer?: Snippet;
}

export interface ModalProviderProps {
  config?: DeepPartial<ModalLibraryConfig>;
  renderIcon?: Snippet<[icon: string]>;
  children?: Snippet;
}

export interface DockProps {
  renderIcon?: Snippet<[icon: string]>;
}

export interface WizardModalProps extends BaseModalProps {
  customIcon?: Snippet;
  onComplete?: () => void;
  onStepChange?: (step: number, direction: 'forward' | 'backward') => void;
  transitionStyle?: WizardTransitionStyle;
  footer?: Snippet<[WizardControls]>;
  children?: Snippet;
}

export interface WizardStepProps {
  title?: string;
  canProceed?: boolean;
  children?: Snippet;
}

export interface PortalProps {
  target?: HTMLElement | string;
  children: Snippet;
}

export declare const Modal: Component<ModalProps>;
export declare const ModalProvider: Component<ModalProviderProps>;
export declare const Dock: Component<DockProps>;
export declare const Backdrop: Component<{}>;
export declare const WizardModal: Component<WizardModalProps>;
export declare const WizardStep: Component<WizardStepProps>;
export declare const Portal: Component<PortalProps>;

export interface UseModalReturn extends ModalOperations {
  isOpen: () => boolean;
  isMinimized: () => boolean;
  isRegistered: () => boolean;
}

export interface UseModalZIndexReturn {
  zIndex: number;
  portalTarget: string | HTMLElement;
}

export declare function useModal(idOrGetter: ModalId | (() => ModalId)): UseModalReturn;
export declare function useModalZIndex(modalId?: ModalId): UseModalZIndexReturn;
