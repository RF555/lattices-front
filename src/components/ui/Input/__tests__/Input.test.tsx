import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { createRef } from 'react';
import { Input } from '../Input';

describe('Input', () => {
  it('should render an input element', () => {
    render(<Input placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('should forward ref to input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('should apply error styling when error prop is true', () => {
    render(<Input error={true} data-testid="error-input" />);
    const input = screen.getByTestId('error-input');

    // The error styling adds 'border-red-500' class
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('focus:border-red-500');
    expect(input).toHaveClass('focus:ring-red-500');
  });

  it('should not apply error styling when error prop is false', () => {
    render(<Input error={false} data-testid="normal-input" />);
    const input = screen.getByTestId('normal-input');

    // Should have normal border styling
    expect(input).toHaveClass('border-gray-300');
    expect(input).not.toHaveClass('border-red-500');
  });

  it('should not apply error styling when error prop is undefined', () => {
    render(<Input data-testid="normal-input" />);
    const input = screen.getByTestId('normal-input');

    expect(input).toHaveClass('border-gray-300');
    expect(input).not.toHaveClass('border-red-500');
  });

  it('should pass through HTML input attributes', () => {
    render(
      <Input
        type="email"
        placeholder="Enter email"
        disabled
        readOnly
        required
        maxLength={50}
        data-testid="custom-input"
      />
    );

    const input = screen.getByTestId('custom-input') as HTMLInputElement;

    expect(input.type).toBe('email');
    expect(input.placeholder).toBe('Enter email');
    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.required).toBe(true);
    expect(input.maxLength).toBe(50);
  });

  it('should merge custom className with default classes', () => {
    render(<Input className="custom-class" data-testid="custom-input" />);
    const input = screen.getByTestId('custom-input');

    // Should have both default and custom classes
    expect(input).toHaveClass('custom-class');
    expect(input).toHaveClass('block');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
  });

  it('should apply disabled styling', () => {
    render(<Input disabled data-testid="disabled-input" />);
    const input = screen.getByTestId('disabled-input');

    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-50');
    expect(input).toHaveClass('disabled:text-gray-500');
  });

  it('should handle value and onChange', () => {
    let value = '';
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      value = e.target.value;
    };

    render(<Input value={value} onChange={handleChange} data-testid="controlled-input" />);
    const input = screen.getByTestId('controlled-input') as HTMLInputElement;

    expect(input.value).toBe('');
  });

  it('should support common input types', () => {
    const { rerender } = render(<Input type="text" data-testid="input" />);
    expect((screen.getByTestId('input') as HTMLInputElement).type).toBe('text');

    rerender(<Input type="password" data-testid="input" />);
    expect((screen.getByTestId('input') as HTMLInputElement).type).toBe('password');

    rerender(<Input type="email" data-testid="input" />);
    expect((screen.getByTestId('input') as HTMLInputElement).type).toBe('email');

    rerender(<Input type="number" data-testid="input" />);
    expect((screen.getByTestId('input') as HTMLInputElement).type).toBe('number');
  });

  it('should have base styling classes', () => {
    render(<Input data-testid="styled-input" />);
    const input = screen.getByTestId('styled-input');

    // Verify key styling classes are applied
    expect(input).toHaveClass('block');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('border-gray-300');
    expect(input).toHaveClass('px-3');
    expect(input).toHaveClass('py-2');
    expect(input).toHaveClass('shadow-sm');
  });
});
