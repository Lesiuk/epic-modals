<script lang="ts">  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { ModalHeaderBaseProps } from '../../../core/types';
  import { RENDER_ICON_CONTEXT } from '../../context';
  import { CSS } from '../../../core/utils/constants';

  interface Props extends ModalHeaderBaseProps {

    customIcon?: Snippet;

    iconElement?: HTMLElement | null;
    onStartDrag?: (e: PointerEvent) => void;
    onToggleStyle: () => void;
    onMinimize: () => void;
    onClose: () => void;
  }

  let {
    title,
    customIcon,
    icon,
    iconElement,
    isTransparent = false,
    titleId,
    headerLayout = 'macos',
    onStartDrag,
    onToggleStyle,
    onMinimize,
    onClose,
    minimizable = true,
    minimizeDisabled = false,
    transparencyEnabled = true
  }: Props = $props();

  function insertIconElement(node: HTMLElement) {
    if (iconElement) {
      node.appendChild(iconElement);
    }
    return {
      destroy() {
        if (iconElement && node.contains(iconElement)) {
          node.removeChild(iconElement);
        }
      }
    };
  }

  const getRenderIcon = getContext<() => Snippet<[string]> | undefined>(RENDER_ICON_CONTEXT);
  const renderIcon = $derived(getRenderIcon?.());

  const isMac = $derived(headerLayout === 'macos');

  function handleDragStart(e: PointerEvent) {

    if ((e.target as HTMLElement).closest('button')) return;
    onStartDrag?.(e);
  }
</script>

<header
  class={CSS.header}
  class:modal-header-draggable={!!onStartDrag}
  class:transparent={isTransparent}
  onpointerdown={handleDragStart}
>
  {#if isMac}

    <div class={CSS.headerTrafficLights}>
      <button
        type="button"
        class="{CSS.headerLight} {CSS.headerLightClose}"
        onclick={onClose}
        aria-label="Close"
      ></button>
      {#if minimizable}
      <button
        type="button"
        class="{CSS.headerLight} {CSS.headerLightMinimize}"
        class:modal-header-light-disabled={minimizeDisabled}
        onclick={minimizeDisabled ? undefined : onMinimize}
        disabled={minimizeDisabled}
        aria-label="Minimize"
        title={minimizeDisabled ? "Enable dock to minimize" : undefined}
      ></button>
      {/if}
      {#if transparencyEnabled}
      <button
        type="button"
        class="{CSS.headerLight} {CSS.headerLightStyle}"
        onclick={onToggleStyle}
        aria-label="Toggle style"
      ></button>
      {/if}
    </div>

    <div class={CSS.headerMacCenter}>
      {#if customIcon}
        <div class={CSS.headerIcon}>
          {@render customIcon()}
        </div>
      {:else if iconElement}
        <div class={CSS.headerIcon} use:insertIconElement></div>
      {:else if icon && renderIcon}
        <div class={CSS.headerIcon}>
          {@render renderIcon(icon)}
        </div>
      {/if}
      <div class={CSS.headerTitleGroup}>
        {#if titleId}
          <h2 id={titleId} class={CSS.headerTitle}>{title}</h2>
        {:else}
          <h2 class={CSS.headerTitle}>{title}</h2>
        {/if}
      </div>
    </div>

    <div class={CSS.headerMacSpacer}></div>
  {:else}

    <div class={CSS.headerTitleGroup}>
      {#if customIcon}
        <div class={CSS.headerIcon}>
          {@render customIcon()}
        </div>
      {:else if iconElement}
        <div class={CSS.headerIcon} use:insertIconElement></div>
      {:else if icon && renderIcon}
        <div class={CSS.headerIcon}>
          {@render renderIcon(icon)}
        </div>
      {/if}
      {#if titleId}
        <h2 id={titleId} class={CSS.headerTitle}>{title}</h2>
      {:else}
        <h2 class={CSS.headerTitle}>{title}</h2>
      {/if}
    </div>

    <div class={CSS.headerActions}>
      {#if transparencyEnabled}
      <button
        type="button"
        class="{CSS.headerBtnWindows} {CSS.headerBtnWindowsStyle}"
        onclick={onToggleStyle}
        aria-label="Toggle style"
      >&#9671;</button>
      {/if}
      {#if minimizable}
      <button
        type="button"
        class={CSS.headerBtnWindows}
        class:modal-header-btn-windows-disabled={minimizeDisabled}
        onclick={minimizeDisabled ? undefined : onMinimize}
        disabled={minimizeDisabled}
        aria-label="Minimize"
        title={minimizeDisabled ? "Enable dock to minimize" : undefined}
      >&#8211;</button>
      {/if}
      <button
        type="button"
        class="{CSS.headerBtnWindows} {CSS.headerBtnWindowsClose}"
        onclick={onClose}
        aria-label="Close"
      >&times;</button>
    </div>
  {/if}
</header>
