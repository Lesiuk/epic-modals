<script lang="ts">  import type { ResizeDirection } from '../../../core/behaviors/resize';
  import { CSS_CLASSES, RESIZE_DIRECTIONS, RESIZE_DIRECTION_LABELS } from '../../../core/utils/constants';

  interface Props {
    onStartResize?: ((e: PointerEvent, direction: ResizeDirection) => void) | undefined;
  }

  let { onStartResize }: Props = $props();

  function handlePointerDown(e: PointerEvent, direction: ResizeDirection) {
    onStartResize?.(e, direction);
  }
</script>

{#if onStartResize}
  <div class={CSS_CLASSES.resizeHandles} role="group" aria-label="Resize handles">
    {#each RESIZE_DIRECTIONS as direction}

      <div
        class="{CSS_CLASSES.resizeHandle} {CSS_CLASSES.resizePrefix}{direction}"
        role="separator"
        tabindex="0"
        aria-label={RESIZE_DIRECTION_LABELS[direction]}
        aria-orientation={direction === 'n' || direction === 's' ? 'horizontal' : 'vertical'}
        onpointerdown={(e) => handlePointerDown(e, direction)}
      ></div>
    {/each}
  </div>
{/if}
