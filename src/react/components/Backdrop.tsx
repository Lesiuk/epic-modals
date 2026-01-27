import React, { useContext, useEffect, useState } from 'react';
import { Portal } from './Portal';
import { ModalProviderConfigContext } from '../context';
import { CSS } from '../../core/utils/constants';
import { getConfig } from '../../core/config';
import { getLayerZIndex } from '../../core/state/stacking';
import { hasOpenModals, isBackdropEnabled, getBackdropConfig } from '../../core/utils/backdrop';

export interface BackdropProps {

  className?: string;
}

export function Backdrop({ className }: BackdropProps) {
  const providerConfig = useContext(ModalProviderConfigContext);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const checkUpdates = () => {
      forceUpdate((n) => n + 1);
    };

    const interval = setInterval(checkUpdates, 50);
    return () => clearInterval(interval);
  }, []);

  const globalConfig = getConfig();
  const portalTarget = providerConfig?.portalTarget ?? globalConfig.portalTarget;

  const backdropEnabled = isBackdropEnabled();
  const backdropConfig = getBackdropConfig();
  const hasOpenModal = hasOpenModals();

  const backdropZIndex = getLayerZIndex('MODAL') - 1;

  if (!backdropEnabled || !hasOpenModal) {
    return null;
  }

  const classes = [
    CSS.backdrop,
    backdropConfig.visible && 'backdrop-visible',
    backdropConfig.blockClicks && 'backdrop-blocking',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Portal target={portalTarget}>
      <div
        className={classes}
        style={{ zIndex: backdropZIndex }}
        aria-hidden="true"
      />
    </Portal>
  );
}
