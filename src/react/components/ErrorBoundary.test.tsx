import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div data-testid="success">Content rendered successfully</div>;
}

const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('basic functionality', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders default fallback UI when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('renders custom fallback ReactNode when provided', () => {
      render(
        <ErrorBoundary fallback={<div data-testid="custom-fallback">Something went wrong</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders custom fallback function when provided', () => {
      const fallbackFn = (error: Error, reset: () => void) => (
        <div>
          <span data-testid="error-msg">Error: {error.message}</span>
          <button data-testid="reset-btn" onClick={reset}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={fallbackFn}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-msg')).toHaveTextContent('Error: Test error message');
      expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
    });
  });

  describe('onError callback', () => {
    it('calls onError when error is caught', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error message' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it('does not call onError when no error occurs', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('reset functionality', () => {
    it('resets error state when retry button is clicked', () => {
      let shouldThrow = true;

      function ConditionalThrower() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="success">Success!</div>;
      }

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalThrower />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error:/)).toBeInTheDocument();

      shouldThrow = false;

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      rerender(
        <ErrorBoundary>
          <ConditionalThrower />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('calls reset function from fallback function', () => {
      let shouldThrow = true;

      function ConditionalThrower() {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="success">Success!</div>;
      }

      const fallbackFn = (_error: Error, reset: () => void) => (
        <button data-testid="custom-reset" onClick={() => {
          shouldThrow = false;
          reset();
        }}>
          Custom Reset
        </button>
      );

      const { rerender } = render(
        <ErrorBoundary fallback={fallbackFn}>
          <ConditionalThrower />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-reset')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('custom-reset'));

      rerender(
        <ErrorBoundary fallback={fallbackFn}>
          <ConditionalThrower />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with error boundary', () => {
    function MyComponent() {
      return <div data-testid="wrapped">Wrapped content</div>;
    }

    const WrappedComponent = withErrorBoundary(MyComponent);

    render(<WrappedComponent />);

    expect(screen.getByTestId('wrapped')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedThrowing = withErrorBoundary(ThrowingComponent);

    render(<WrappedThrowing />);

    expect(screen.getByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('passes error boundary props', () => {
    const onError = vi.fn();
    const WrappedThrowing = withErrorBoundary(ThrowingComponent, {
      onError,
      fallback: <div data-testid="hoc-fallback">HOC Fallback</div>,
    });

    render(<WrappedThrowing />);

    expect(screen.getByTestId('hoc-fallback')).toBeInTheDocument();
    expect(onError).toHaveBeenCalled();
  });

  it('preserves component display name', () => {
    function MyNamedComponent() {
      return <div>Content</div>;
    }

    const WrappedComponent = withErrorBoundary(MyNamedComponent);

    expect(WrappedComponent.displayName).toBe('WithErrorBoundary(MyNamedComponent)');
  });

  it('passes props to wrapped component', () => {
    interface Props {
      message: string;
    }

    function PropsComponent({ message }: Props) {
      return <div data-testid="message">{message}</div>;
    }

    const WrappedProps = withErrorBoundary(PropsComponent);

    render(<WrappedProps message="Hello World" />);

    expect(screen.getByTestId('message')).toHaveTextContent('Hello World');
  });
});
