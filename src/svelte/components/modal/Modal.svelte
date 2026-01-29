<script lang="ts">  import { onMount, onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { BaseModalProps, ExternalElementProps } from '../../../core/types';
  import {
    registerModal,
    unregisterModal,
    createModalRegistration,
  } from '../../../core/state/operations';
  import { getModalState } from '../../../core/state';
  import { pending } from '../../../core/state/pending-factory';
  import { getReactiveStateVersion } from '../../stores.svelte';
  import ModalInner from './ModalInner.svelte';

  interface ModalComponentProps extends BaseModalProps, ExternalElementProps {

    customIcon?: Snippet;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    id,
    title,
    icon,
    customIcon,
    iconElement,
    maxWidth = '600px',
    preferredHeight,
    autoOpen = false,
    openSourcePosition,
    glow,
    config,
    closeOnEscape = true,
    onClose,
    children,
    footer,
    bodyElement,
    footerElement,
  }: ModalComponentProps = $props();

  let isRegistered = $state(false);

  onMount(() => {
    registerModal(createModalRegistration({ id, title, icon, autoOpen, glow }));
    isRegistered = true;
  });

  onDestroy(() => {

    const state = getModalState(id);
    if (state?.isHiddenWithParent) return;

    unregisterModal(id);
  });

  const shouldMount = $derived.by(() => {
    if (!isRegistered) return false;

    getReactiveStateVersion();
    const state = getModalState(id);

    if (!state) return false;

    return state.isOpen ||
           state.isMinimized ||
           pending.has('open', id) ||
           pending.has('close', id) ||
           pending.has('minimize', id);
  });
</script>

{#if shouldMount}
  <ModalInner
    {id}
    {title}
    {icon}
    {customIcon}
    {iconElement}
    {maxWidth}
    {preferredHeight}
    {autoOpen}
    {openSourcePosition}
    {glow}
    {config}
    {closeOnEscape}
    {onClose}
    {children}
    {footer}
    {bodyElement}
    {footerElement}
    skipRegistration={true}
  />
{/if}
