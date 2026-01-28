import { VanillaModal, type VanillaModalOptions } from './VanillaModal';
import { VanillaDock } from './VanillaDock';
import { VanillaBackdrop } from './VanillaBackdrop';
import type { ModalLibraryConfig } from '../core/config';
import { setConfig, getConfig } from '../core/config';
import { initializeStacking } from '../core/state/stacking';
import { initializeResizeListener, cleanupResizeListener } from '../core/state/layout';

export {
  openModal,
  closeModal,
  closeAllModals,
  minimizeModal,
  restoreModal,
  bringToFront,
  isModalOpen,
} from '../core/state';

export { setConfig, getConfig } from '../core/config';

export type { VanillaModalOptions } from './VanillaModal';
export type { VanillaDockOptions } from './VanillaDock';
export type { VanillaBackdropOptions } from './VanillaBackdrop';

export interface ModalOptions extends Omit<VanillaModalOptions, 'container' | 'content' | 'footer'> {

  content?: string | HTMLElement;

  footer?: string | HTMLElement;

  customIcon?: string | HTMLElement;
}

export interface ModalControl {
  destroy: () => void;

  update: (options: Partial<ModalOptions>) => void;
}

export interface DockControl {
  destroy: () => void;
}

export interface BackdropControl {
  destroy: () => void;
}

function toElement(content: string | HTMLElement): HTMLElement {
  if (typeof content === 'string') {
    const el = document.createElement('div');
    el.innerHTML = content;
    return el;
  }
  return content;
}

export function createModal(options: ModalOptions): ModalControl {
  const { content, footer, customIcon, ...rest } = options;

  const contentElement = content ? toElement(content) : undefined;
  const footerElement = footer ? toElement(footer) : undefined;

  if (customIcon) {
    console.warn('VanillaModal: customIcon support not yet implemented');
  }

  const modal = new VanillaModal({
    ...rest,
    container: document.body,
    content: contentElement,
    footer: footerElement,
  });

  return {
    destroy: () => modal.destroy(),
    update: (_newOptions: Partial<ModalOptions>) => {

      console.warn('Vanilla modal update not yet implemented');
    },
  };
}

export function createDock(): DockControl {
  const dock = new VanillaDock({
    container: document.body,
  });

  return {
    destroy: () => dock.destroy(),
  };
}

export function createBackdrop(): BackdropControl {
  const backdrop = new VanillaBackdrop({
    container: document.body,
  });

  return {
    destroy: () => backdrop.destroy(),
  };
}

export interface InitOptions {
  config?: Partial<ModalLibraryConfig>;

  backdrop?: boolean;

  dock?: boolean;
}

export interface InitControl {
  destroy: () => void;
  backdrop: BackdropControl | null;
  dock: DockControl | null;
}

export function init(options: InitOptions = {}): InitControl {
  const { config: configOverride } = options;

  if (configOverride) {
    setConfig(configOverride);
  }

  initializeStacking();
  initializeResizeListener();

  const config = getConfig();

  const shouldCreateBackdrop = options.backdrop ?? config.features.backdrop;
  const backdrop = shouldCreateBackdrop ? createBackdrop() : null;

  const shouldCreateDock = options.dock ?? config.features.dock;
  const dock = shouldCreateDock ? createDock() : null;

  return {
    backdrop,
    dock,
    destroy: () => {
      backdrop?.destroy();
      dock?.destroy();
      cleanupResizeListener();
    },
  };
}
