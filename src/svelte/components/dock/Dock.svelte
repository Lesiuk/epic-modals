<script lang="ts">  import { fly, scale } from 'svelte/transition';
  import { cubicOut, backOut } from 'svelte/easing';
  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import { restoreModal } from '../../../core/state/operations';
  import {
    getModalsStore,
    isModalAnimating,
    shakeElement,
  } from '../../../core/state';
  import { getLayerZIndex } from '../../../core/state/parent-child';
  import { getConfig } from '../../../core/config';
  import { getReactiveStateVersion, getReactiveConfigVersion } from '../../stores.svelte';
  import {
    getMinimizedModals,
    calculateDockDragPosition,
    constrainDockPosition,
  } from '../../../core/utils/dock';
  import Portal from '../Portal.svelte';
  import { useWindowEvent } from '../../hooks';
  import { RENDER_ICON_CONTEXT } from '../../context';
  import { CSS, DATA_ATTRS } from '../../../core/utils/constants';
  import { toDataId } from '../../../core/utils/helpers';

  type IconSnippet = Snippet<[icon: string]>;

  interface Props {

    renderIcon?: IconSnippet;
  }

  let { renderIcon: renderIconProp }: Props = $props();

  const getRenderIconFromContext = getContext<() => IconSnippet | undefined>(RENDER_ICON_CONTEXT);
  const renderIcon = $derived(renderIconProp ?? getRenderIconFromContext?.());

  const modalsStore = getModalsStore();

  const config = $derived.by(() => {
    getReactiveConfigVersion();
    return getConfig();
  });
  const dockZIndex = $derived(getLayerZIndex('DOCK'));

  const dockPosition = $derived(config.dock.position);
  const dockLabelMode = $derived(config.dock.labelMode);
  let dockOrientation = $state<'horizontal' | 'vertical'>('horizontal');
  let dockFreePosition = $state({ x: 100, y: 100 });

  let dockContainerEl: HTMLElement | null = $state(null);
  let isDockDragging = $state(false);
  let dockDragOffset = { x: 0, y: 0 };
  let activeDockPointerId: number | null = null;

  const minimizedModals = $derived.by(() => {
    getReactiveStateVersion();
    return getMinimizedModals();
  });

  const flyParams = $derived.by(() => {
    switch (dockPosition) {
      case 'left': return { x: -20, duration: 250, easing: cubicOut };
      case 'right': return { x: 20, duration: 250, easing: cubicOut };
      default: return { y: 20, duration: 250, easing: cubicOut };
    }
  });

  function startDockDrag(e: PointerEvent) {
    if (dockPosition !== 'free') return;
    isDockDragging = true;
    activeDockPointerId = e.pointerId;
    dockDragOffset = {
      x: e.clientX - dockFreePosition.x,
      y: e.clientY - dockFreePosition.y,
    };
    (e.currentTarget as HTMLElement)?.setPointerCapture(e.pointerId);
    window.addEventListener('pointermove', onDockDrag);
    window.addEventListener('pointerup', stopDockDrag);
    window.addEventListener('pointercancel', stopDockDrag);
  }

  function onDockDrag(e: PointerEvent) {
    if (e.pointerId !== activeDockPointerId || !dockContainerEl) return;
    const rect = dockContainerEl.getBoundingClientRect();
    dockFreePosition = calculateDockDragPosition(
      e.clientX,
      e.clientY,
      dockDragOffset,
      rect.width,
      rect.height
    );
  }

  function stopDockDrag(e: PointerEvent) {
    if (e.pointerId !== activeDockPointerId) return;
    isDockDragging = false;
    activeDockPointerId = null;
    window.removeEventListener('pointermove', onDockDrag);
    window.removeEventListener('pointerup', stopDockDrag);
    window.removeEventListener('pointercancel', stopDockDrag);
  }

  const { addListener } = useWindowEvent();

  function constrainDockToViewport() {
    if (dockPosition !== 'free' || !dockContainerEl) return;
    const rect = dockContainerEl.getBoundingClientRect();
    const constrained = constrainDockPosition(dockFreePosition, rect.width, rect.height);
    if (constrained.x !== dockFreePosition.x || constrained.y !== dockFreePosition.y) {
      dockFreePosition = constrained;
    }
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    addListener('resize', constrainDockToViewport);
  });

  export function setDockOrientation(orient: 'horizontal' | 'vertical') {
    dockOrientation = orient;
  }
  export function setDockFreePosition(pos: { x: number; y: number }) {
    dockFreePosition = pos;
  }
  export function getDockState() {
    return {
      dockPosition,
      dockOrientation,
      dockFreePosition,
      dockLabelMode,
    };
  }
</script>

{#if config.features.dock}
<Portal target={config.portalTarget}>
  <div
    bind:this={dockContainerEl}
    class={CSS.dockContainer}
    class:modal-dock-left={dockPosition === 'left'}
    class:modal-dock-right={dockPosition === 'right'}
    class:modal-dock-bottom={dockPosition === 'bottom'}
    class:modal-dock-free={dockPosition === 'free'}
    class:modal-dock-empty={minimizedModals.length === 0}
    style:z-index={dockZIndex}
    style={dockPosition === 'free' ? `left: ${dockFreePosition.x}px; top: ${dockFreePosition.y}px;` : ''}
    data-dock-container="true"
    transition:fly={minimizedModals.length > 0 ? flyParams : { duration: 0 }}
    >
      <div
        class={CSS.dock}
        class:modal-dock-free-horizontal={dockPosition === 'free' && dockOrientation === 'horizontal'}
        class:modal-dock-free-vertical={dockPosition === 'free' && dockOrientation === 'vertical'}
      >
        {#if dockPosition === 'free'}
          <button
            type="button"
            class={CSS.dockHandle}
            class:modal-dock-handle-dragging={isDockDragging}
            onpointerdown={startDockDrag}
            aria-label="Drag dock"
          ></button>
        {/if}

        {#each minimizedModals as modal, i (modal.id)}
          {@const childModal = modal.lastChildId ? modalsStore.get(modal.lastChildId) : null}
          <button
            class={CSS.dockItem}
            class:modal-dock-item-has-glow={!!modal.glow}
            class:modal-dock-item-has-child={!!modal.lastChildId}
            class:modal-dock-item-label-beside={dockLabelMode === 'beside'}
            class:modal-dock-item-label-below={dockLabelMode === 'below'}
            {...{[DATA_ATTRS.modalId]: toDataId(modal.id)}}
            aria-label="Restore {modal.title}"
            onclick={(e) => {
              if (isModalAnimating(modal.id)) {
                shakeElement(e.currentTarget as HTMLElement);
              } else {
                restoreModal(modal.id);
              }
            }}
            transition:scale={{ duration: 300, delay: i * 50, easing: backOut, start: 0.5 }}
            style={modal.glow ? `--modal-dock-glow-color: ${modal.glow.color};` : ''}
          >
            <span class={CSS.dockItemIcon}>
              {#if modal.icon && renderIcon}
                {@render renderIcon(modal.icon)}
              {:else}
                <span class={CSS.dockItemIconPlaceholder}>{modal.title.charAt(0)}</span>
              {/if}
            </span>
            {#if dockLabelMode !== 'hidden'}
              <span class={CSS.dockItemLabel}>{modal.title}</span>
            {/if}
            <span class={CSS.dockItemGlow}></span>
            {#if modal.lastChildId && childModal}
              <span class={CSS.dockChildIndicator}>
                {#if childModal.icon && renderIcon}
                  {@render renderIcon(childModal.icon)}
                {:else}
                  <span>+</span>
                {/if}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </Portal>
{/if}
