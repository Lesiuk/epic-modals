import React, { useEffect, useContext, type ReactNode } from 'react';
import type { BaseModalProps } from '../../../core/types';
import {
  registerModal,
  unregisterModal,
  createModalRegistration,
} from '../../../core/state/registration';
import { bringToFront } from '../../../core/state';
import { ModalInner } from './ModalInner';
import { ModalProviderConfigContext, RenderIconContext } from '../../context';

export interface ModalProps extends BaseModalProps {
  children?: ReactNode;
  footer?: ReactNode;

  renderIcon?: () => ReactNode;
}

export function Modal({
  id,
  title,
  icon,
  maxWidth = '600px',
  preferredHeight,
  autoOpen = false,
  glow,
  config,
  closeOnEscape = true,
  onClose,
  children,
  footer,
  renderIcon,
}: ModalProps) {

  const providerConfig = useContext(ModalProviderConfigContext);
  const contextRenderIcon = useContext(RenderIconContext);

  useEffect(() => {
    registerModal(createModalRegistration({ id, title, icon, autoOpen, glow }));

    if (autoOpen) {
      bringToFront(id);
    }

    return () => {
      unregisterModal(id);
    };
  }, [id]);

  const iconRenderer = renderIcon ?? (icon && contextRenderIcon ? () => contextRenderIcon(icon) : undefined);

  return (
    <ModalInner
      id={id}
      title={title}
      icon={icon}
      renderIcon={iconRenderer}
      maxWidth={maxWidth}
      preferredHeight={preferredHeight}
      autoOpen={autoOpen}
      glow={glow}
      config={config}
      providerConfig={providerConfig ?? undefined}
      closeOnEscape={closeOnEscape}
      onClose={onClose}
      skipRegistration={true}
      footer={footer}
    >
      {children}
    </ModalInner>
  );
}
