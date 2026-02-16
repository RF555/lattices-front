import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('should render label and children', () => {
    render(
      <FormField label="Username">
        <input data-testid="input" />
      </FormField>,
    );
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toBeInTheDocument();
  });

  it('should associate label with input via htmlFor', () => {
    render(
      <FormField label="Email" htmlFor="email-input">
        <input id="email-input" />
      </FormField>,
    );
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-input');
  });

  it('should show error message with alert role', () => {
    render(
      <FormField label="Password" error="Password is required">
        <input />
      </FormField>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Password is required');
    expect(alert).toHaveClass('text-red-600');
  });

  it('should not render error when prop is absent', () => {
    render(
      <FormField label="Name">
        <input />
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <FormField label="Field" className="mt-4">
        <input />
      </FormField>,
    );
    expect(container.firstChild).toHaveClass('mt-4');
  });
});
