import { createContext, useContext, useCallback, useRef, useMemo, type ReactNode } from 'react';

export interface StepRegistration {
  title: string;
  getCanProceed: () => boolean;
}

export interface WizardContextValue {

  registerStep: (step: StepRegistration) => number;

  unregisterStep: (index: number) => void;

  updateStep: (index: number, update: Partial<StepRegistration>) => void;

  currentStep: number;

  getSteps: () => StepRegistration[];
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizardContext(): WizardContextValue | null {
  return useContext(WizardContext);
}

export interface WizardProviderProps {

  currentStep: number;

  onStepsChange: (steps: StepRegistration[]) => void;
  children: ReactNode;
}

export function WizardProvider({ currentStep, onStepsChange, children }: WizardProviderProps) {

  const stepsRef = useRef<(StepRegistration | null)[]>([]);

  const onStepsChangeRef = useRef(onStepsChange);
  onStepsChangeRef.current = onStepsChange;

  const notifyStepsChange = useCallback(() => {
    const validSteps = stepsRef.current.filter((s): s is StepRegistration => s !== null);
    onStepsChangeRef.current(validSteps);
  }, []);

  const registerStep = useCallback((step: StepRegistration): number => {

    let index = stepsRef.current.findIndex((s) => s === null);
    if (index === -1) {
      index = stepsRef.current.length;
    }
    stepsRef.current[index] = step;
    notifyStepsChange();
    return index;
  }, [notifyStepsChange]);

  const unregisterStep = useCallback((index: number): void => {
    if (index >= 0 && index < stepsRef.current.length) {
      stepsRef.current[index] = null;

      while (stepsRef.current.length > 0 && stepsRef.current[stepsRef.current.length - 1] === null) {
        stepsRef.current.pop();
      }

      notifyStepsChange();
    }
  }, [notifyStepsChange]);

  const updateStep = useCallback((index: number, update: Partial<StepRegistration>): void => {
    const currentStep = stepsRef.current[index];
    if (index >= 0 && index < stepsRef.current.length && currentStep) {
      stepsRef.current[index] = { ...currentStep, ...update };
      notifyStepsChange();
    }
  }, [notifyStepsChange]);

  const getSteps = useCallback((): StepRegistration[] => {
    return stepsRef.current.filter((s): s is StepRegistration => s !== null);
  }, []);

  const value = useMemo<WizardContextValue>(() => ({
    registerStep,
    unregisterStep,
    updateStep,
    currentStep,
    getSteps,
  }), [registerStep, unregisterStep, updateStep, currentStep, getSteps]);

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}
