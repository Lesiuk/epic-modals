import React from 'react';
import type { ResizeDirection } from '../../../core/behaviors/resize';
import { CSS, RESIZE_DIRECTIONS, RESIZE_DIRECTION_LABELS } from '../../../core/utils/constants';

export interface ResizeHandlesProps {

  onStartResize?: (e: React.PointerEvent, direction: ResizeDirection) => void;
}

export function ResizeHandles({ onStartResize }: ResizeHandlesProps) {
  if (!onStartResize) {
    return null;
  }

  return (
    <div className={CSS.resizeHandles} role="group" aria-label="Resize handles">
      {RESIZE_DIRECTIONS.map((direction) => (
        <div
          key={direction}
          className={`${CSS.resizeHandle} ${CSS.resizePrefix}${direction}`}
          role="separator"
          tabIndex={0}
          aria-label={RESIZE_DIRECTION_LABELS[direction]}
          aria-orientation={direction === 'n' || direction === 's' ? 'horizontal' : 'vertical'}
          onPointerDown={(e) => onStartResize(e, direction)}
        />
      ))}
    </div>
  );
}
