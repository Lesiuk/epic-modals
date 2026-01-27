<script lang="ts">  import { onMount } from 'svelte';
  import { usePortal } from '../hooks';
  import type { Snippet } from 'svelte';

  interface Props {
    target?: HTMLElement | string;
    children: Snippet;
  }

  let { target = 'body', children }: Props = $props();

  let containerElement: HTMLElement | null = null;
  let cleanup: (() => void) | null = null;

  const { mount } = usePortal();

  onMount(() => {
    if (containerElement) {
      cleanup = mount(containerElement, target);
    }

    return () => {
      cleanup?.();
    };
  });
</script>

<div bind:this={containerElement} style="display: contents;">
  {@render children()}
</div>
