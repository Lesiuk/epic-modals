import type { ModalId, Position, Dimensions } from '../types';
import type { DragBehavior } from '../behaviors/drag';
import type { PositioningConfig } from '../config';
import { getModalDialogElement } from '../utils/helpers';
import { whenHasDimensions } from '../utils/dom';
import {
  getModalState,
  updateModalPosition,
  linkModals,
  getPendingParentLink,
  getModalLayoutInfos,
} from '../state';
import {
  getElementBounds,
  calculateEqualSpaceLayout,
} from '../utils/viewport';
import { applyLayoutPositions } from '../state/layout';

export interface PositioningConfigHelper {
  getPositioning: <K extends keyof PositioningConfig>(key: K) => PositioningConfig[K];
}

export interface ModalPositioningOptions {

  id: ModalId;

  dataId: string;

  configHelper: PositioningConfigHelper;

  getDragBehavior: () => DragBehavior;

  getElement: () => HTMLElement | null;
}

export class ModalPositioning {
  private id: ModalId;
  private dataId: string;
  private configHelper: PositioningConfigHelper;
  private getDragBehavior: () => DragBehavior;
  private getElement: () => HTMLElement | null;

  constructor(options: ModalPositioningOptions) {
    this.id = options.id;
    this.dataId = options.dataId;
    this.configHelper = options.configHelper;
    this.getDragBehavior = options.getDragBehavior;
    this.getElement = options.getElement;
  }

  constrainToViewport(size: Dimensions): void {
    const drag = this.getDragBehavior();
    if (!drag.hasBeenDragged()) return;
    drag.constrainToViewport(size);
  }

  shouldApplySmartPositioning(): boolean {
    if (this.configHelper.getPositioning('strategy') !== 'smart') {
      return false;
    }
    if (this.getDragBehavior().hasBeenDragged()) {
      return false;
    }
    return true;
  }

  applySmartPositioning(): boolean {
    if (this.configHelper.getPositioning('strategy') !== 'smart') {
      return false;
    }

    const state = getModalState(this.id);
    const pendingLink = getPendingParentLink();
    if (state?.parentId || (pendingLink && pendingLink.childId === this.id)) {
      return false;
    }
    if (state?.hasBeenDragged || state?.position) {
      return false;
    }

    const el = this.getElement() || getModalDialogElement(this.id);
    if (!el) return false;

    const width = el.offsetWidth;
    const height = el.offsetHeight;
    if (width <= 0 || height <= 0) return false;

    const modalGap = this.configHelper.getPositioning('modalGap');

    const existingModals = getModalLayoutInfos().filter(m => m.id !== (this.id as string));
    const avoidBounds = getElementBounds(
      this.configHelper.getPositioning('avoidElements')
    );

    const result = calculateEqualSpaceLayout(existingModals, { id: this.id as string, width, height }, {
      modalGap,
      viewportMargin: modalGap,
      avoidBounds,
      avoidMargin: modalGap,
    });

    const newPos = result.positions.get(this.id as string);
    if (!newPos) return false;

    const existingMoves = new Map<string, Position>();
    for (const [id, pos] of result.positions) {
      if (id !== (this.id as string)) {
        existingMoves.set(id, pos);
      }
    }

    if (existingMoves.size > 0) {
      applyLayoutPositions(existingMoves);
    }

    const drag = this.getDragBehavior();
    drag.setPosition(newPos);
    drag.setHasBeenDragged(true);
    updateModalPosition(this.id, newPos, { size: { width, height } });
    return true;
  }

  scheduleSmartPositioning(): void {
    const getElement = () =>
      this.getElement() || getModalDialogElement(this.id);

    whenHasDimensions(getElement)
      .then(() => {
        this.applySmartPositioning();
      })
      .catch(() => {
        this.applySmartPositioning();
      });
  }

  centerChildOnParent(parentId: ModalId): boolean {
    const parent = getModalState(parentId);
    if (!parent) return false;

    const childEl = this.getElement() || getModalDialogElement(this.id);
    const parentEl = getModalDialogElement(parentId);
    const parentRect = parentEl?.getBoundingClientRect();
    const parentPos = parent.position ??
      (parentRect ? { x: parentRect.left, y: parentRect.top } : null);

    if (!parentPos || !childEl) return false;

    const parentWidth =
      parent.size?.width ?? parentEl?.offsetWidth ?? parentRect?.width ?? 480;
    const parentHeight =
      parent.size?.height ?? parentEl?.offsetHeight ?? parentRect?.height ?? 400;
    const childWidth = childEl.offsetWidth;
    const childHeight = childEl.offsetHeight;

    if (
      parentWidth <= 0 ||
      parentHeight <= 0 ||
      childWidth <= 0 ||
      childHeight <= 0
    ) {
      return false;
    }

    const childPos: Position = {
      x: parentPos.x + (parentWidth - childWidth) / 2,
      y: parentPos.y + (parentHeight - childHeight) / 2,
    };

    const drag = this.getDragBehavior();
    drag.setPosition(childPos);
    drag.setHasBeenDragged(true);
    updateModalPosition(this.id, childPos, {
      size: { width: childWidth, height: childHeight },
    });

    if ((!parent.position || !parent.size) && parentRect) {
      updateModalPosition(
        parentId,
        { x: parentRect.left, y: parentRect.top },
        { size: { width: parentWidth, height: parentHeight } }
      );
    }

    const offset: Position = {
      x: childPos.x - parentPos.x,
      y: childPos.y - parentPos.y,
    };
    linkModals(parentId, this.id, offset);
    return true;
  }

  scheduleCenterChildOnParent(parentId: ModalId): void {
    whenHasDimensions(() => this.getElement())
      .then(() => {
        this.centerChildOnParent(parentId);
      })
      .catch(() => {
        this.centerChildOnParent(parentId);
      });
  }
}
