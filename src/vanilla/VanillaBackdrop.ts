import { closeAllModals } from '../core/state/open-close';
import { subscribe } from '../core/state';
import { CSS_CLASSES } from '../core/utils/constants';
import { hasOpenModals, getBackdropConfig } from '../core/utils/backdrop';

export interface VanillaBackdropOptions {
  container: HTMLElement;
}

export class VanillaBackdrop {
  private element: HTMLElement;
  private unsubscribe: () => void;
  private abortController = new AbortController();

  constructor(options: VanillaBackdropOptions) {
    this.element = this.createDOM();
    options.container.appendChild(this.element);

    this.unsubscribe = subscribe(() => {
      this.render();
    });

    this.render();
  }

  private createDOM(): HTMLElement {
    const backdrop = document.createElement('div');
    backdrop.className = CSS_CLASSES.backdrop;

    backdrop.addEventListener('click', () => {
      const backdropConfig = getBackdropConfig();
      if (backdropConfig.blockClicks) {
        closeAllModals();
      }
    }, { signal: this.abortController.signal });

    return backdrop;
  }

  private render(): void {

    const backdropConfig = getBackdropConfig();

    if (!backdropConfig.visible) {
      this.element.style.display = 'none';
      return;
    }

    if (hasOpenModals()) {
      this.element.classList.add(CSS_CLASSES.backdropVisible);
      this.element.style.display = '';
    } else {
      this.element.classList.remove(CSS_CLASSES.backdropVisible);
      this.element.style.display = 'none';
    }
  }

  destroy(): void {
    this.abortController.abort();
    this.unsubscribe();
    this.element.remove();
  }
}
