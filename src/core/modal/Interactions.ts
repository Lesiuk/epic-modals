import type { ResizeDirection } from '../behaviors/resize';
import type { ModalFeatures } from '../types';
import { trapFocus, focusFirstElement } from '../behaviors/focusTrap';

export interface InteractionConfigHelper {
  isFeatureEnabled: (feature: keyof ModalFeatures) => boolean;
}

export interface InteractionDragBehavior {
  onPointerDown: (e: PointerEvent, element: HTMLElement) => void;
  onPointerMove: (e: PointerEvent, modalSize: { width: number; height: number }) => void;
  onPointerUp: (e: PointerEvent, element: HTMLElement) => void;
  isDragging: () => boolean;
  getPosition: () => { x: number; y: number };
  hasBeenDragged: () => boolean;
}

export interface InteractionResizeBehavior {
  startResize: (e: PointerEvent, direction: ResizeDirection) => void;
  hasBeenResized: () => boolean;
  getSize: () => { width: number; height: number };
  justFinishedResizing: () => boolean;
}

export interface InteractionState {
  hasChild: boolean;
}

export interface ModalInteractionsOptions {
  id: string;
  configHelper: InteractionConfigHelper;
  getDragBehavior: () => InteractionDragBehavior;
  getResizeBehavior: () => InteractionResizeBehavior;
  getElement: () => HTMLElement | null;
  getState: () => InteractionState;
  onDragMove: () => void;
  onDragEnd: () => void;
  onClose?: () => void;
  closeOnEscape?: boolean;
  isTopModal: () => boolean;
}

export class ModalInteractions {
  private options: ModalInteractionsOptions;

  constructor(options: ModalInteractionsOptions) {
    this.options = options;
  }

  startDrag(e: PointerEvent): void {
    const element = this.options.getElement();
    if (!this.options.configHelper.isFeatureEnabled('drag') || !element) return;
    this.options.getDragBehavior().onPointerDown(e, element);
  }

  startResize(e: PointerEvent, direction: ResizeDirection): void {
    const state = this.options.getState();
    if (!this.options.configHelper.isFeatureEnabled('resize') || state.hasChild) return;
    this.options.getResizeBehavior().startResize(e, direction);
  }

  handlePointerMove(e: PointerEvent): void {
    const element = this.options.getElement();
    if (!element) return;

    const drag = this.options.getDragBehavior();
    const wasDragging = drag.isDragging();

    const resize = this.options.getResizeBehavior();
    const size = resize.hasBeenResized()
      ? resize.getSize()
      : { width: element.offsetWidth, height: element.offsetHeight };

    drag.onPointerMove(e, size);

    if (wasDragging && drag.isDragging()) {
      this.options.onDragMove();
    }
  }

  handlePointerUp(e: PointerEvent): void {
    const element = this.options.getElement();
    if (!element) return;

    const drag = this.options.getDragBehavior();
    const wasDragging = drag.isDragging();
    drag.onPointerUp(e, element);

    if (wasDragging && !this.options.getResizeBehavior().justFinishedResizing()) {
      this.options.onDragEnd();
    }
  }

  handleKeyDown(e: KeyboardEvent): void {

    if (this.options.closeOnEscape && e.key === 'Escape' && this.options.isTopModal()) {
      e.stopPropagation();
      this.options.onClose?.();
    }
  }

  handleTabKey(e: KeyboardEvent): void {
    const element = this.options.getElement();
    if (element) {
      trapFocus(e, element);
    }
  }

  focusFirst(): void {
    const element = this.options.getElement();
    if (element) {
      focusFirstElement(element);
    }
  }
}
