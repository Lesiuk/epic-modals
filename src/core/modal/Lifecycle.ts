export interface ModalLifecycleOptions {
  onMount?: () => void;
  onDestroy?: () => void;
  onWindowResize?: () => void;
}

export class ModalLifecycle {
  private element: HTMLElement | null = null;
  private resizeHandler: (() => void) | null = null;
  private options: ModalLifecycleOptions;

  constructor(options: ModalLifecycleOptions = {}) {
    this.options = options;
  }

  mount(element: HTMLElement): void {
    this.element = element;

    if (this.options.onWindowResize) {
      this.resizeHandler = this.options.onWindowResize;
      window.addEventListener('resize', this.resizeHandler);
    }

    this.options.onMount?.();
  }

  destroy(): void {

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    this.element = null;
    this.options.onDestroy?.();
  }

  getElement(): HTMLElement | null {
    return this.element;
  }

  isMounted(): boolean {
    return this.element !== null;
  }
}
