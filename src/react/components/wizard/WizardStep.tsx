import { useEffect, useRef, type ReactNode } from 'react';
import { useWizardContext } from './WizardContext';

export interface WizardStepProps {

  title?: string;

  canProceed?: boolean;

  children?: ReactNode;
}

export function WizardStep({ title = '', canProceed = true, children }: WizardStepProps) {
  const wizardContext = useWizardContext();
  const stepIndexRef = useRef<number>(-1);

  const canProceedRef = useRef(canProceed);
  canProceedRef.current = canProceed;

  useEffect(() => {
    if (wizardContext) {
      stepIndexRef.current = wizardContext.registerStep({
        title,

        getCanProceed: () => canProceedRef.current,
      });

      return () => {
        if (stepIndexRef.current >= 0) {
          wizardContext.unregisterStep(stepIndexRef.current);
        }
      };
    }

  }, [wizardContext]);

  useEffect(() => {
    if (wizardContext && stepIndexRef.current >= 0) {
      wizardContext.updateStep(stepIndexRef.current, { title });
    }
  }, [wizardContext, title]);

  const isActive = wizardContext && stepIndexRef.current >= 0 && wizardContext.currentStep === stepIndexRef.current;

  if (!wizardContext || !isActive) {
    return null;
  }

  return <>{children}</>;
}

WizardStep.displayName = 'WizardStep';
