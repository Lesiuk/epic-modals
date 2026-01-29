<script lang="ts">  import { onMount, onDestroy, setContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { ModalId, BaseModalProps } from '../../../core/types';
  import {
    registerModal,
    unregisterModal,
  } from '../../../core/state/operations';
  import { getModalState } from '../../../core/state';
  import { pending } from '../../../core/state/pending-factory';
  import { getReactiveStateVersion } from '../../stores.svelte';
  import { getModalDialogElement } from '../../../core/utils/helpers';
  import ModalInner from '../modal/ModalInner.svelte';
  import { WizardState, type WizardTransitionStyle, type WizardControls } from '../../wizardContext.svelte';

  interface WizardModalProps extends Omit<BaseModalProps, 'id'> {

    id: ModalId;

    onComplete?: () => void;

    onStepChange?: (step: number, direction: 'forward' | 'backward') => void;

    transitionStyle?: WizardTransitionStyle;

    customIcon?: Snippet;

    footer?: Snippet<[WizardControls]>;

    children?: Snippet;
  }

  let {
    id,
    title,
    icon,
    customIcon,
    maxWidth = '500px',
    preferredHeight,
    autoOpen = false,
    openSourcePosition,
    glow,
    config,
    closeOnEscape = true,
    onClose,
    onComplete,
    onStepChange,
    transitionStyle = 'fade-slide',
    footer: footerSnippet,
    children: wizardChildren,
  }: WizardModalProps = $props();

  const wizard = new WizardState();

  $effect(() => {
    wizard.setTransitionStyle(transitionStyle);
  });

  const ANIMATION_DURATION = 700;
  const STEP_CHANGE_DELAY = 350;

  setContext('wizard', wizard);

  function animateModal(direction: 'forward' | 'backward') {
    if (transitionStyle !== 'slide-through') return;

    const modalEl = getModalDialogElement(id);
    if (!modalEl) return;

    const animClass = direction === 'forward' ? 'wizard-modal-slide-forward' : 'wizard-modal-slide-backward';
    modalEl.classList.add(animClass);

    setTimeout(() => {
      modalEl.classList.remove(animClass);
    }, ANIMATION_DURATION);
  }

  function next() {
    const currentStepData = wizard.steps[wizard.currentStep];
    if (currentStepData && !currentStepData.getCanProceed()) return;

    if (wizard.currentStep >= wizard.steps.length - 1) {
      onComplete?.();
    } else {
      wizard.direction = 'forward';
      wizard.isAnimating = true;
      wizard.previousStep = wizard.currentStep;

      animateModal('forward');

      if (transitionStyle === 'slide-through') {
        setTimeout(() => {
          wizard.currentStep++;
          onStepChange?.(wizard.currentStep, 'forward');
        }, STEP_CHANGE_DELAY);
      } else {
        wizard.currentStep++;
        onStepChange?.(wizard.currentStep, 'forward');
      }

      setTimeout(() => {
        wizard.isAnimating = false;
        wizard.previousStep = -1;
      }, ANIMATION_DURATION);
    }
  }

  function back() {
    if (wizard.currentStep > 0) {
      wizard.direction = 'backward';
      wizard.isAnimating = true;
      wizard.previousStep = wizard.currentStep;

      animateModal('backward');

      if (transitionStyle === 'slide-through') {
        setTimeout(() => {
          wizard.currentStep--;
          onStepChange?.(wizard.currentStep, 'backward');
        }, STEP_CHANGE_DELAY);
      } else {
        wizard.currentStep--;
        onStepChange?.(wizard.currentStep, 'backward');
      }

      setTimeout(() => {
        wizard.isAnimating = false;
        wizard.previousStep = -1;
      }, ANIMATION_DURATION);
    }
  }

  function goToStep(index: number) {
    if (index < wizard.currentStep && index >= 0) {
      wizard.direction = 'backward';
      wizard.isAnimating = true;
      wizard.previousStep = wizard.currentStep;

      animateModal('backward');

      if (transitionStyle === 'slide-through') {
        setTimeout(() => {
          wizard.currentStep = index;
          onStepChange?.(wizard.currentStep, 'backward');
        }, STEP_CHANGE_DELAY);
      } else {
        wizard.currentStep = index;
        onStepChange?.(wizard.currentStep, 'backward');
      }

      setTimeout(() => {
        wizard.isAnimating = false;
        wizard.previousStep = -1;
      }, ANIMATION_DURATION);
    }
  }

  const isFirstStep = $derived(wizard.currentStep === 0);
  const isLastStep = $derived(wizard.steps.length > 0 && wizard.currentStep === wizard.steps.length - 1);
  const progress = $derived(wizard.steps.length > 0 ? ((wizard.currentStep + 1) / wizard.steps.length) * 100 : 0);
  const canProceed = $derived(wizard.steps[wizard.currentStep]?.getCanProceed() ?? true);
  const totalSteps = $derived(wizard.steps.length);

  const controls = $derived<WizardControls>({
    currentStep: wizard.currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    canProceed,
    progress,
    steps: wizard.steps.map(s => ({ title: s.title })),
    next,
    back,
    goToStep,
  });

  let isRegistered = $state(false);
  let wasMounted = $state(false);

  onMount(() => {
    registerModal({
      id,
      title,
      icon: icon ?? '',
      isOpen: autoOpen,
      isMinimized: false,
      isHiddenWithParent: false,
      isTransparent: false,
      isRejected: false,
      position: null,
      size: null,
      hasBeenDragged: false,
      dockPosition: 0,
      glow: glow ?? null,
      parentId: undefined,
      childId: undefined,
      offsetFromParent: undefined,
    });
    isRegistered = true;
  });

  onDestroy(() => {
    unregisterModal(id);
  });

  const shouldMount = $derived.by(() => {
    if (!isRegistered) return false;
    getReactiveStateVersion();
    const state = getModalState(id);
    if (!state) return false;
    return state.isOpen || state.isMinimized || pending.has('open', id) || pending.has('close', id) || pending.has('minimize', id);
  });

  $effect.pre(() => {
    const mounted = shouldMount;
    if (mounted && !wasMounted) {
      wizard.reset();
    }
    wasMounted = mounted;
  });
</script>

{#if shouldMount}
  <ModalInner
    {id}
    {title}
    {icon}
    {customIcon}
    {maxWidth}
    {preferredHeight}
    {autoOpen}
    {openSourcePosition}
    {glow}
    {config}
    {closeOnEscape}
    {onClose}
    skipRegistration={true}
  >
    {#snippet children()}
      <div class="wizard-viewport" class:wizard-viewport-carousel={transitionStyle === 'slide-through'}>
        <div
          class="wizard-container"
          class:wizard-slide-forward={wizard.isAnimating && wizard.direction === 'forward' && transitionStyle === 'slide-through'}
          class:wizard-slide-backward={wizard.isAnimating && wizard.direction === 'backward' && transitionStyle === 'slide-through'}
        >
          {#if wizardChildren}
            {@render wizardChildren()}
          {/if}
        </div>
      </div>
    {/snippet}

    {#snippet footer()}
      {#if footerSnippet}
        {@render footerSnippet(controls)}
      {/if}
    {/snippet}
  </ModalInner>
{/if}

<style>
  .wizard-viewport {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .wizard-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
