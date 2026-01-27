import { subscribe, restoreModal, getModalsStore, isModalAnimating, shakeElement } from '../core/state';
import { getConfig } from '../core/config';
import { getMinimizedModals, getDockContainerClasses, getDockClasses } from '../core/utils/dock';
import { getLayerZIndex } from '../core/state/stacking';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../core/utils/constants';
import { toDataId } from '../core/utils/helpers';
import type { ModalState } from '../core/types';

export interface VanillaDockOptions {
  container: HTMLElement;

  renderIcon?: (icon: string) => HTMLElement | null;
}

export class VanillaDock {
  private containerEl: HTMLElement;
  private dockEl: HTMLElement;
  private parentContainer: HTMLElement;
  private unsubscribe: () => void;
  private abortController = new AbortController();
  private isAttached = false;
  private options: VanillaDockOptions;

  constructor(options: VanillaDockOptions) {
    this.options = options;
    this.parentContainer = options.container;
    this.containerEl = this.createContainerDOM();
    this.dockEl = this.createDockDOM();
    this.containerEl.appendChild(this.dockEl);

    this.unsubscribe = subscribe(() => {
      this.render();
    });

    this.render();
  }

  private createContainerDOM(): HTMLElement {
    const container = document.createElement('div');
    container.setAttribute('data-dock-container', 'true');
    return container;
  }

  private createDockDOM(): HTMLElement {
    const dock = document.createElement('div');
    dock.className = CSS_CLASSES.dock;
    return dock;
  }

  private render(): void {
    const config = getConfig();

    if (!config.features.dock) {
      if (this.isAttached) {
        this.containerEl.remove();
        this.isAttached = false;
      }
      return;
    }

    const minimizedModals = getMinimizedModals();

    if (minimizedModals.length === 0) {
      if (this.isAttached) {
        this.containerEl.remove();
        this.isAttached = false;
      }
      return;
    }

    if (!this.isAttached) {
      this.parentContainer.appendChild(this.containerEl);
      this.isAttached = true;
    }

    const dockPosition = config.dock.position;
    this.containerEl.className = getDockContainerClasses(dockPosition, minimizedModals.length === 0);
    this.containerEl.style.zIndex = String(getLayerZIndex('DOCK'));

    this.dockEl.className = getDockClasses(dockPosition, 'horizontal');

    this.dockEl.innerHTML = '';

    if (dockPosition === 'free') {
      const handle = this.createDockHandle();
      this.dockEl.appendChild(handle);
    }

    const modalsStore = getModalsStore();
    const labelMode = config.dock.labelMode;

    for (const modal of minimizedModals) {
      const childModal = modal.lastChildId ? modalsStore.get(modal.lastChildId) : null;
      const item = this.createDockItem(modal, childModal ?? null, labelMode);
      this.dockEl.appendChild(item);
    }
  }

  private createDockHandle(): HTMLElement {
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = CSS_CLASSES.dockHandle;
    handle.setAttribute('aria-label', 'Drag dock');
    return handle;
  }

  private createDockItem(
    modal: ModalState,
    childModal: ModalState | null,
    labelMode: 'beside' | 'below' | 'hidden'
  ): HTMLElement {
    const item = document.createElement('button');

    const classNames = [
      CSS_CLASSES.dockItem,
      modal.glow && CSS_CLASSES.dockItemHasGlow,
      modal.lastChildId && CSS_CLASSES.dockItemHasChild,
      labelMode === 'beside' && CSS_CLASSES.dockItemLabelBeside,
      labelMode === 'below' && CSS_CLASSES.dockItemLabelBelow,
    ].filter(Boolean).join(' ');

    item.className = classNames;
    item.setAttribute(DATA_ATTRIBUTES.modalId, toDataId(modal.id));
    item.setAttribute('aria-label', `Restore ${modal.title}`);

    if (modal.glow) {
      item.style.setProperty('--modal-dock-glow-color', modal.glow.color);
    }

    const iconSpan = document.createElement('span');
    iconSpan.className = CSS_CLASSES.dockItemIcon;

    if (modal.icon && this.options.renderIcon) {
      const iconEl = this.options.renderIcon(modal.icon);
      if (iconEl) {
        iconSpan.appendChild(iconEl);
      } else {
        iconSpan.appendChild(this.createIconPlaceholder(modal.title));
      }
    } else {
      iconSpan.appendChild(this.createIconPlaceholder(modal.title));
    }
    item.appendChild(iconSpan);

    if (labelMode !== 'hidden') {
      const labelSpan = document.createElement('span');
      labelSpan.className = CSS_CLASSES.dockItemLabel;
      labelSpan.textContent = modal.title;
      item.appendChild(labelSpan);
    }

    const glowSpan = document.createElement('span');
    glowSpan.className = CSS_CLASSES.dockItemGlow;
    item.appendChild(glowSpan);

    if (modal.lastChildId && childModal) {
      const childIndicator = document.createElement('span');
      childIndicator.className = CSS_CLASSES.dockChildIndicator;

      if (childModal.icon && this.options.renderIcon) {
        const childIconEl = this.options.renderIcon(childModal.icon);
        if (childIconEl) {
          childIndicator.appendChild(childIconEl);
        } else {
          childIndicator.textContent = '+';
        }
      } else {
        childIndicator.textContent = '+';
      }
      item.appendChild(childIndicator);
    }

    item.addEventListener('click', (e) => {
      if (isModalAnimating(modal.id)) {
        shakeElement(e.currentTarget as HTMLElement);
      } else {
        restoreModal(modal.id);
      }
    }, { signal: this.abortController.signal });

    return item;
  }

  private createIconPlaceholder(title: string): HTMLElement {
    const placeholder = document.createElement('span');
    placeholder.className = CSS_CLASSES.dockItemIconPlaceholder;
    placeholder.textContent = title.charAt(0);
    return placeholder;
  }

  destroy(): void {
    this.abortController.abort();
    this.unsubscribe();
    if (this.isAttached) {
      this.containerEl.remove();
      this.isAttached = false;
    }
  }
}
