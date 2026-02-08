import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { createRef } from 'react';
import { Select } from '../Select';

describe('Select', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3', disabled: true },
  ];

  it('should render a select element with options', () => {
    render(<Select options={mockOptions} data-testid="test-select" />);
    const select = screen.getByTestId('test-select');

    expect(select).toBeInTheDocument();
    expect(select.tagName).toBe('SELECT');

    // Should render all options
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render placeholder when provided', () => {
    render(
      <Select options={mockOptions} placeholder="Select an option" data-testid="test-select" />,
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
    const placeholderOption = screen.getByText('Select an option') as HTMLOptionElement;
    expect(placeholderOption.disabled).toBe(true);
    expect(placeholderOption.value).toBe('');
  });

  it('should forward ref to select element', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select ref={ref} options={mockOptions} />);

    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    expect(ref.current?.tagName).toBe('SELECT');
  });

  it('should have mobile-responsive text size to prevent iOS zoom', () => {
    render(<Select options={mockOptions} data-testid="responsive-select" />);
    const select = screen.getByTestId('responsive-select');

    // Mobile: text-base (16px) prevents iOS Safari auto-zoom
    // Desktop (sm+): text-sm for consistency with design
    expect(select).toHaveClass('text-base');
    expect(select).toHaveClass('sm:text-sm');
  });

  it('should handle disabled options', () => {
    render(<Select options={mockOptions} data-testid="test-select" />);

    const option1 = screen.getByText('Option 1') as HTMLOptionElement;
    const option3 = screen.getByText('Option 3') as HTMLOptionElement;

    expect(option1.disabled).toBe(false);
    expect(option3.disabled).toBe(true);
  });

  it('should pass through HTML select attributes', () => {
    render(
      <Select
        options={mockOptions}
        disabled
        required
        name="test-select"
        data-testid="custom-select"
      />,
    );

    const select = screen.getByTestId('custom-select') as HTMLSelectElement;

    expect(select.disabled).toBe(true);
    expect(select.required).toBe(true);
    expect(select.name).toBe('test-select');
  });

  it('should merge custom className with default classes', () => {
    render(<Select options={mockOptions} className="custom-class" data-testid="custom-select" />);
    const select = screen.getByTestId('custom-select');

    expect(select).toHaveClass('custom-class');
    expect(select).toHaveClass('block');
    expect(select).toHaveClass('w-full');
    expect(select).toHaveClass('rounded-md');
    expect(select).toHaveClass('border-gray-300');
  });

  it('should apply disabled styling', () => {
    render(<Select options={mockOptions} disabled data-testid="disabled-select" />);
    const select = screen.getByTestId('disabled-select');

    expect(select).toBeDisabled();
    expect(select).toHaveClass('disabled:bg-gray-50');
    expect(select).toHaveClass('disabled:text-gray-500');
  });
});
