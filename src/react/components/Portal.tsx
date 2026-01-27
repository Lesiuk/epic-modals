import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {

  target?: HTMLElement | string;

  children: ReactNode;
}

export function Portal({ target = '#modal-portal', children }: PortalProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  if (containerRef.current === null) {
    if (typeof target === 'string') {

      let element = document.querySelector(target);
      if (!element) {

        if (target.startsWith('#')) {
          element = document.createElement('div');
          element.id = target.slice(1);
          document.body.appendChild(element);
        } else {

          element = document.body;
        }
      }
      containerRef.current = element as HTMLElement;
    } else {
      containerRef.current = target;
    }
  }

  return createPortal(children, containerRef.current);
}
