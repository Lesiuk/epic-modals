import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Children,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from 'react';
import { Modal, type ModalProps } from '../modal/Modal';
import { WizardStep, type WizardStepProps } from './WizardStep';

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

export interface WizardModalProps extends Omit<ModalProps, 'children' | 'footer'> {

  onComplete?: () => void;

  onStepChange?: (step: number, direction: 'forward' | 'backward') => void;

  footer?: (controls: WizardControls) => ReactNode;

  showProgress?: boolean;

  showNavigation?: boolean;

  children?: ReactNode;
}

const ANIMATION_DURATION = 300;

function isWizardStep(element: ReactNode): element is ReactElement<WizardStepProps> {
  return isValidElement(element) &&
    (element.type === WizardStep ||
     (element.type as { displayName?: string })?.displayName === 'WizardStep');
}

export function WizardModal({
  id,
  onComplete,
  onStepChange,
  footer,
  showProgress = true,
  showNavigation = true,
  maxWidth = '500px',
  children,
  onClose,
  ...modalProps
}: WizardModalProps) {

  const steps = Children.toArray(children).filter(isWizardStep);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const prevStepRef = useRef(currentStep);

  const currentStepElement = steps[currentStep] as ReactElement<WizardStepProps> | undefined;
  const canProceed = currentStepElement?.props.canProceed ?? true;

  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setDirection(currentStep > prevStepRef.current ? 'forward' : 'backward');
      setIsAnimating(true);
      setAnimationKey((k) => k + 1);
      const timer = setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
      prevStepRef.current = currentStep;
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const next = useCallback(() => {
    if (!canProceed) return;

    if (currentStep >= steps.length - 1) {
      onComplete?.();
    } else {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep, 'forward');
    }
  }, [currentStep, steps.length, canProceed, onComplete, onStepChange]);

  const back = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep, 'backward');
    }
  }, [currentStep, onStepChange]);

  const goToStep = useCallback(
    (index: number) => {
      if (index < currentStep && index >= 0) {
        setCurrentStep(index);
        onStepChange?.(index, 'backward');
      }
    },
    [currentStep, onStepChange]
  );

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const totalSteps = steps.length;

  const stepData = steps.map((step) => ({
    title: (step as ReactElement<WizardStepProps>).props.title || '',
  }));

  const controls: WizardControls = {
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    canProceed,
    progress,
    steps: stepData,
    next,
    back,
    goToStep,
  };

  const getAnimationClass = (): string => {
    if (!isAnimating) return '';
    return direction === 'forward' ? 'wizard-slide-left' : 'wizard-slide-right';
  };

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    onClose?.();
  }, [onClose]);

  const shouldShowProgress = showProgress && totalSteps > 1;

  const defaultFooter = showNavigation ? (
    <div className="wizard-navigation" style={wizardStyles.navigation}>
      <button
        className="wizard-btn-back"
        style={{
          ...wizardStyles.button,
          ...(isFirstStep ? wizardStyles.buttonDisabled : {}),
        }}
        onClick={back}
        disabled={isFirstStep}
      >
        Back
      </button>
      <button
        className="wizard-btn-next"
        style={{
          ...wizardStyles.button,
          ...wizardStyles.buttonPrimary,
          ...(!canProceed ? wizardStyles.buttonDisabled : {}),
        }}
        onClick={next}
        disabled={!canProceed}
      >
        {isLastStep ? 'Finish' : 'Next'}
      </button>
    </div>
  ) : null;

  return (
    <Modal
      id={id}
      maxWidth={maxWidth}
      onClose={handleClose}
      footer={footer ? footer(controls) : defaultFooter}
      {...modalProps}
    >
      <div className="wizard-viewport" style={styles.viewport}>
        {}
        {shouldShowProgress && (
          <div className="wizard-progress" style={wizardStyles.progress}>
            {stepData.map((step, index) => (
              <div key={index} style={wizardStyles.stepItem}>
                <button
                  className={`wizard-step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  style={{
                    ...wizardStyles.stepDot,
                    ...(index === currentStep ? wizardStyles.stepDotActive : {}),
                    ...(index < currentStep ? wizardStyles.stepDotCompleted : {}),
                  }}
                  onClick={() => goToStep(index)}
                  disabled={index >= currentStep}
                />
                {step.title && (
                  <span style={wizardStyles.stepTitle}>{step.title}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="wizard-container" style={styles.container}>
          {}
          <div
            key={animationKey}
            className={`wizard-step-content ${getAnimationClass()}`}
            style={styles.stepContent}
          >
            {currentStepElement}
          </div>
        </div>
      </div>

      {}
      <style>{animationStyles}</style>
    </Modal>
  );
}

const styles: Record<string, React.CSSProperties> = {
  viewport: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  stepContent: {
    flex: 1,
    overflowY: 'auto',
  },
};

const wizardStyles: Record<string, React.CSSProperties> = {
  progress: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '24px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    background: 'transparent',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  stepDotActive: {
    borderColor: '#6366f1',
    background: '#6366f1',
    transform: 'scale(1.2)',
  },
  stepDotCompleted: {
    borderColor: '#6366f1',
    background: '#6366f1',
    opacity: 0.6,
  },
  stepTitle: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    maxWidth: '80px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    gap: '12px',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

const animationStyles = `
  .wizard-slide-left {
    animation: wizardSlideInFromRight 0.3s ease forwards;
  }
  .wizard-slide-right {
    animation: wizardSlideInFromLeft 0.3s ease forwards;
  }
  @keyframes wizardSlideInFromRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes wizardSlideInFromLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
