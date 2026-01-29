import React, { useEffect, useMemo, type ReactNode } from 'react';
import type { ModalLibraryConfig } from '../../core/config';
import { getConfig } from '../../core/config';
import { initializeStacking, resetStacking } from '../../core/state/parent-child';
import { initializeResizeListener, cleanupResizeListener } from '../../core/state/layout';
import { ModalProviderConfigContext } from '../context';
import { Backdrop } from './Backdrop';

export interface ModalProviderProps {

  config?: Partial<ModalLibraryConfig>;

  children?: ReactNode;
}

export function ModalProvider({ config: configOverride, children }: ModalProviderProps) {
  useEffect(() => {

    initializeStacking();
    initializeResizeListener();

    const globalConfig = getConfig();
    const target = configOverride?.portalTarget ?? globalConfig.portalTarget;
    let createdPortal: HTMLElement | null = null;

    if (typeof target === 'string' && typeof document !== 'undefined') {
      const existing = document.querySelector(target);
      if (!existing) {
        createdPortal = document.createElement('div');
        createdPortal.id = target.replace('#', '');
        document.body.appendChild(createdPortal);
      }
    }

    return () => {
      resetStacking();
      cleanupResizeListener();
      if (createdPortal) {
        createdPortal.remove();
      }
    };
  }, [configOverride]);

  const providerConfig = useMemo(() => configOverride, [configOverride]);

  return React.createElement(
    ModalProviderConfigContext.Provider,
    { value: providerConfig },
    React.createElement(React.Fragment, null,
      children,
      React.createElement(Backdrop, null)
    )
  );
}
