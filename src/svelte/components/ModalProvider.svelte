<script lang="ts">  import { untrack, setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { ModalLibraryConfig } from '../../core/config';
  import type { DeepPartial } from '../../core/types';
  import { getConfig, setConfig } from '../../core/config';
  import { initializeStacking, resetStacking } from '../../core/state/parent-child';
  import { initializeResizeListener, cleanupResizeListener } from '../../core/state/layout';
  import Backdrop from './Backdrop.svelte';
  import { RENDER_ICON_CONTEXT, MODAL_PROVIDER_CONFIG_CONTEXT } from '../context';

  interface Props {

    config?: DeepPartial<ModalLibraryConfig>;

    renderIcon?: Snippet<[icon: string]>;

    children?: Snippet;
  }

  let { config: configOverride, renderIcon, children }: Props = $props();

  untrack(() => {
    if (configOverride) {
      setConfig(configOverride);
    }
  });

  setContext(RENDER_ICON_CONTEXT, () => renderIcon);

  setContext(MODAL_PROVIDER_CONFIG_CONTEXT, () => configOverride);

  $effect(() => {
    untrack(() => {
      initializeStacking();
      initializeResizeListener();
    });

    return () => {
      resetStacking();
      cleanupResizeListener();
    };
  });

  $effect(() => {
    if (typeof document === 'undefined') return;

    const globalConfig = getConfig();
    const target = configOverride?.portalTarget ?? globalConfig.portalTarget;
    if (typeof target === 'string') {
      const existing = document.querySelector(target);
      if (!existing) {
        const portalEl = document.createElement('div');
        portalEl.id = target.replace('#', '');
        document.body.appendChild(portalEl);

        return () => {
          portalEl.remove();
        };
      }
    }
  });
</script>

<Backdrop />
{@render children?.()}
