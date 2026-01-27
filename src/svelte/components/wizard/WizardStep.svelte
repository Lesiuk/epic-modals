<script lang="ts">  import { getContext, onMount, untrack } from 'svelte';
  import type { Snippet } from 'svelte';
  import { WizardState } from '../../wizardContext.svelte';

  interface WizardStepProps {

    title?: string;

    canProceed?: boolean;

    children?: Snippet;
  }

  let {
    title = '',
    canProceed = true,
    children,
  }: WizardStepProps = $props();

  const wizard = getContext<WizardState>('wizard');

  let stepIndex = $state(-1);
  let lastCanProceed: boolean | undefined;

  onMount(() => {
    stepIndex = wizard.registerStep({
      title,
      getCanProceed: () => canProceed,
    });
    lastCanProceed = canProceed;
  });

  $effect(() => {
    const currentCanProceed = canProceed;
    const idx = untrack(() => stepIndex);
    const prev = untrack(() => lastCanProceed);
    if (idx >= 0 && currentCanProceed !== prev) {
      lastCanProceed = currentCanProceed;
      untrack(() => {
        wizard.updateStep(idx, { getCanProceed: () => currentCanProceed });
      });
    }
  });

  const isActive = $derived(stepIndex >= 0 && wizard.currentStep === stepIndex);
  const direction = $derived(wizard.direction);
  const isAnimating = $derived(wizard.isAnimating);
  const transitionStyle = $derived(wizard.transitionStyle);

  const shouldShow = $derived(isActive);
</script>

{#if shouldShow}
  <div
    class="wizard-step-wrapper"
    class:wizard-fade-slide-left={isAnimating && isActive && direction === 'forward' && transitionStyle === 'fade-slide'}
    class:wizard-fade-slide-right={isAnimating && isActive && direction === 'backward' && transitionStyle === 'fade-slide'}
  >
    {#if children}
      {@render children()}
    {/if}
  </div>
{/if}

<style>
  .wizard-step-wrapper {
    height: 100%;
  }

  .wizard-fade-slide-left {
    animation: fadeSlideFromRight 0.3s ease forwards;
  }

  .wizard-fade-slide-right {
    animation: fadeSlideFromLeft 0.3s ease forwards;
  }

  @keyframes fadeSlideFromRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeSlideFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
