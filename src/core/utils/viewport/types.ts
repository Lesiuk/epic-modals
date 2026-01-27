import type { Position } from '../../types';

export interface ModalBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportConstraintOptions {

  margin?: number;

  allowPartialVisibility?: boolean;
}

export interface SmartPositionOptions {

  modalGap?: number;

  margin?: number;

  gridResolution?: number;

  avoidBounds?: ModalBounds[];

  avoidMargin?: number;
}

export interface ModalBoundsWithId extends ModalBounds {
  id: string;
}

export interface ModalLayoutInfo {
  id: string;
  width: number;
  height: number;
  currentPosition: Position;

  parentId?: string;
}

export interface SmartLayoutOptions {

  modalGap?: number;

  viewportMargin?: number;

  avoidBounds?: ModalBounds[];

  avoidMargin?: number;
}

export interface SmartLayoutResult {

  positions: Map<string, Position>;
}
