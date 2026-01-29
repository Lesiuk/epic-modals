<script lang="ts">  import { onMount, setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { BaseModalProps, ExternalElementProps } from '../../../core/types';
  import { MODAL_ID_CONTEXT } from '../../context';
  import { ModalController, type ComputedModalState } from '../../../core/modal';
  import { bringToFront } from '../../../core/state';
  import { getReactiveConfigVersion } from '../../stores.svelte';
  import { CSS, DATA_ATTRS } from '../../../core/utils/constants';
  import { toDataId } from '../../../core/utils/helpers';

  import Portal from '../Portal.svelte';
  import ModalHeader from './ModalHeader.svelte';
  import ResizeHandles from './ResizeHandles.svelte';

  import { appendElement } from '../../actions/appendElement';

  import { useModalConfig } from '../../hooks/useModalConfig.svelte';

  interface ModalComponentProps extends BaseModalProps, ExternalElementProps {

    customIcon?: Snippet;

    providerConfig?: Partial<import('../../../core/config').ModalLibraryConfig>;

    children?: Snippet;

    footer?: Snippet;

    skipRegistration?: boolean;
  }

  let {
    id,
    title,
    customIcon,
    icon,
    iconElement,
    description,
    maxWidth = '600px',
    preferredHeight,
    autoOpen = false,
    openSourcePosition: propOpenSourcePosition,
    glow,
    config: modalConfig,
    providerConfig,
    closeOnEscape = true,
    onClose,
    children,
    footer,
    skipRegistration = false,
    bodyElement,
    footerElement,
  }: ModalComponentProps = $props();

  setContext(MODAL_ID_CONTEXT, () => id);

  const configHelper = useModalConfig({
    getModalConfig: () => modalConfig,
    getProviderConfig: () => providerConfig,
  });

  const portalTarget = $derived.by(() => {
    return configHelper.getEffectiveConfig().portalTarget;
  });

  let controller: ModalController | null = $state(null);
  let computedState: ComputedModalState | null = $state(null);
  let modalEl: HTMLElement | null = $state(null);

  onMount(() => {
    controller = new ModalController({
      id,
      title,
      icon,
      config: modalConfig,
      providerConfig,
      maxWidth,
      preferredHeight,
      glow,
      closeOnEscape,
      autoOpen,
      openSourcePosition: propOpenSourcePosition,
      onClose,
      skipRegistration,
      configHelper,
    });

    const unsubscribe = controller.subscribe((newState) => {
      computedState = newState;
    });

    computedState = controller.getState();

    return () => {
      unsubscribe();
      controller?.destroy();
      controller = null;
    };
  });

  $effect(() => {
    if (modalEl && controller) {
      controller.mount(modalEl);
    }
  });

  $effect(() => {
    if (controller && propOpenSourcePosition !== undefined) {
      controller.setOpenSourcePosition(propOpenSourcePosition);
    }
  });

  $effect(() => {
    if (controller) {
      controller.updateOptions({ glow, maxWidth, preferredHeight, closeOnEscape });
    }
  });

  const dataId = $derived(toDataId(id));
  const titleId = $derived(`modal-title-${dataId}`);
  const descriptionId = $derived(description ? `modal-desc-${dataId}` : undefined);

  const draggable = $derived((computedState as ComputedModalState | null)?.draggable ?? false);
  const resizable = $derived((computedState as ComputedModalState | null)?.resizable ?? false);
  const minimizable = $derived((computedState as ComputedModalState | null)?.minimizable ?? false);
  const minimizeDisabled = $derived.by(() => {
    getReactiveConfigVersion();
    return !configHelper.isFeatureEnabled('dock');
  });
  const transparencyEnabled = $derived.by(() => {
    getReactiveConfigVersion();
    return configHelper.isFeatureEnabled('transparency');
  });
  const headerLayout = $derived.by(() => {
    getReactiveConfigVersion();
    return configHelper.getAppearance('headerLayout');
  });

  const isVisible = $derived((computedState as ComputedModalState | null)?.isVisible ?? false);
  const showOverlay = $derived((computedState as ComputedModalState | null)?.showOverlay ?? false);
  const overlayClosing = $derived((computedState as ComputedModalState | null)?.overlayClosing ?? false);
  const isTransparent = $derived((computedState as ComputedModalState | null)?.isTransparent ?? false);

  const modalStyle = $derived.by(() => {
    const s = computedState as ComputedModalState | null;
    if (!s) return '';
    return Object.entries(s.style)
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');
  });

  function handleDragStart(e: PointerEvent) {
    controller?.startDrag(e);
  }

  function handlePointerMove(e: PointerEvent) {
    controller?.handlePointerMove(e);
  }

  function handlePointerUp(e: PointerEvent) {
    controller?.handlePointerUp(e);
  }

  function handleKeyDown(e: KeyboardEvent) {
    controller?.handleKeyDown(e);
  }

  function handleMinimize() {
    controller?.minimize();
  }

  function handleClose() {
    controller?.close();
  }

  function handleToggleStyle() {
    controller?.toggleTransparency();
  }

  function handleResizeStart(e: PointerEvent, direction: import('../../../core/behaviors/resize').ResizeDirection) {
    controller?.startResize(e, direction);
  }
</script>

{#if isVisible && computedState}
  <Portal target={portalTarget}>
    <div
      bind:this={modalEl}
      class={computedState.cssClasses.join(' ')}
      {...{[DATA_ATTRS.modalId]: dataId}}
      data-state={computedState.dataState}
      data-animation-phase={computedState.dataAnimationPhase}
      style={modalStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      tabindex="-1"
      onkeydown={handleKeyDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointerdowncapture={() => bringToFront(id)}
    >
      {#if description}
        <span id={descriptionId} class="sr-only">{description}</span>
      {/if}

      <ModalHeader
        title={title}
        customIcon={customIcon}
        icon={icon}
        iconElement={iconElement}
        isTransparent={isTransparent}
        titleId={titleId}
        headerLayout={headerLayout}
        onStartDrag={draggable ? handleDragStart : undefined}
        onToggleStyle={handleToggleStyle}
        onMinimize={handleMinimize}
        onClose={handleClose}
        minimizable={minimizable}
        minimizeDisabled={minimizeDisabled}
        transparencyEnabled={transparencyEnabled}
      />

      <div class={CSS.body} use:appendElement={bodyElement}>
        {@render children?.()}
      </div>

      {#if footer || footerElement}
        <div class={CSS.footer} use:appendElement={footerElement}>
          {#if footer}
            {@render footer()}
          {/if}
        </div>
      {/if}

      <ResizeHandles onStartResize={resizable && !computedState.hasChild ? handleResizeStart : undefined} />

      {#if showOverlay}
        <div class={CSS.childOverlay} class:modal-overlay-closing={overlayClosing}></div>
      {/if}
    </div>
  </Portal>
{/if}
