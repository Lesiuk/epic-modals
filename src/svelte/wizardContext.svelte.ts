export interface StepRegistration {
  title: string;
  getCanProceed: () => boolean;
}

export type WizardTransitionStyle = 'fade-slide' | 'slide-through';

export interface WizardControls {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  progress: number;
  steps: Array<{ title: string }>;
  next: () => void;
  back: () => void;
  goToStep: (index: number) => void;
}

export class WizardState {
  currentStep = $state(0);
  previousStep = $state(-1);
  direction = $state<'forward' | 'backward'>('forward');
  isAnimating = $state(false);
  steps = $state<StepRegistration[]>([]);
  transitionStyle = $state<WizardTransitionStyle>('fade-slide');

  registerStep(step: StepRegistration): number {
    const index = this.steps.length;
    this.steps = [...this.steps, step];
    return index;
  }

  unregisterStep(_index: number): void {

  }

  updateStep(index: number, update: Partial<StepRegistration>): void {
    if (index >= 0 && index < this.steps.length) {
      this.steps = this.steps.map((s, i) => (i === index ? { ...s, ...update } : s));
    }
  }

  reset(): void {
    this.currentStep = 0;
    this.previousStep = -1;
    this.direction = 'forward';
    this.isAnimating = false;
    this.steps = [];

  }

  setTransitionStyle(style: WizardTransitionStyle): void {
    this.transitionStyle = style;
  }
}
