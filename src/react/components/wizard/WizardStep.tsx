import type { ReactNode } from 'react';

export interface WizardStepProps {

  title?: string;

  canProceed?: boolean;

  children?: ReactNode;
}

export function WizardStep({ children }: WizardStepProps) {

  return <>{children}</>;
}

WizardStep.displayName = 'WizardStep';
