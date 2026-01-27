import type { ModalState, Position } from '../types';
import { getModalsStore } from '../state';
import { constrainToViewport } from './viewport';

export function getMinimizedModals(): ModalState[] {
  const store = getModalsStore();
  return Array.from(store.values())
    .filter((m) => m.isMinimized)
    .sort((a, b) => a.dockPosition - b.dockPosition);
}

export function constrainDockPosition(
  position: Position,
  dockWidth: number,
  dockHeight: number
): Position {
  const constrained = constrainToViewport(position.x, position.y, dockWidth, dockHeight);
  return {
    x: Math.round(constrained.x),
    y: Math.round(constrained.y),
  };
}

export function calculateDockDragPosition(
  clientX: number,
  clientY: number,
  dragOffset: Position,
  dockWidth: number,
  dockHeight: number,
  padding = 8
): Position {
  const maxX = window.innerWidth - dockWidth - padding;
  const maxY = window.innerHeight - dockHeight - padding;
  const x = Math.min(Math.max(clientX - dragOffset.x, padding), Math.max(padding, maxX));
  const y = Math.min(Math.max(clientY - dragOffset.y, padding), Math.max(padding, maxY));
  return { x: Math.round(x), y: Math.round(y) };
}

export function getDockContainerClasses(
  dockPosition: 'left' | 'right' | 'bottom' | 'free',
  isEmpty: boolean
): string {
  const classes = ['modal-dock-container'];

  if (dockPosition === 'left') classes.push('modal-dock-left');
  else if (dockPosition === 'right') classes.push('modal-dock-right');
  else if (dockPosition === 'bottom') classes.push('modal-dock-bottom');
  else if (dockPosition === 'free') classes.push('modal-dock-free');

  if (isEmpty) classes.push('modal-dock-empty');

  return classes.join(' ');
}

export function getDockClasses(
  dockPosition: 'left' | 'right' | 'bottom' | 'free',
  orientation: 'horizontal' | 'vertical'
): string {
  const classes = ['modal-dock'];

  if (dockPosition === 'free') {
    classes.push(
      orientation === 'horizontal'
        ? 'modal-dock-free-horizontal'
        : 'modal-dock-free-vertical'
    );
  }

  return classes.join(' ');
}
