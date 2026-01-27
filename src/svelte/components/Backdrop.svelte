<script lang="ts">  import { fade } from 'svelte/transition';
  import { getConfig } from '../../core/config';
  import { getLayerZIndex } from '../../core/state/stacking';
  import { getReactiveStateVersion, getReactiveConfigVersion } from '../stores.svelte';
  import { hasOpenModals, isBackdropEnabled, getBackdropConfig } from '../../core/utils/backdrop';
  import Portal from './Portal.svelte';
  import { CSS_CLASSES } from '../../core/utils/constants';

  const config = $derived.by(() => {
    getReactiveConfigVersion();
    return getConfig();
  });

  const backdropConfig = $derived.by(() => {
    getReactiveConfigVersion();
    return getBackdropConfig();
  });

  const backdropEnabled = $derived.by(() => {
    getReactiveConfigVersion();
    return isBackdropEnabled();
  });

  const hasOpenModal = $derived.by(() => {
    getReactiveStateVersion();
    return hasOpenModals();
  });

  const backdropZIndex = $derived(getLayerZIndex('MODAL') - 1);
</script>

<Portal target={config.portalTarget}>
  {#if hasOpenModal && backdropEnabled}
    <div
      class={CSS_CLASSES.backdrop}
      class:backdrop-visible={backdropConfig.visible}
      class:backdrop-blocking={backdropConfig.blockClicks}
      style:z-index={backdropZIndex}
      transition:fade={{ duration: 200 }}
      aria-hidden="true"
    ></div>
  {/if}
</Portal>
