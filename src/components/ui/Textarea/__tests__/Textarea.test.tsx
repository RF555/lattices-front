import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { createRef } from 'react';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('should render a textarea element', () => {
    render(<Textarea placeholder="Enter description" />);
    const textarea = screen.getByPlaceholderText('Enter description');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should forward ref to textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current?.tagName).toBe('TEXTAREA');
  });

  it('should apply error styling when error prop is true', () => {
    render(<Textarea error={true} data-testid="error-textarea" />);
    const textarea = screen.getByTestId('error-textarea');

    expect(textarea).toHaveClass('border-red-500');
    expect(textarea).toHaveClass('focus:border-red-500');
    expect(textarea).toHaveClass('focus:ring-red-500');
  });

  it('should not apply error styling when error prop is false', () => {
    render(<Textarea error={false} data-testid="normal-textarea" />);
    const textarea = screen.getByTestId('normal-textarea');

    expect(textarea).toHaveClass('border-gray-300');
    expect(textarea).not.toHaveClass('border-red-500');
  });

  it('should have mobile-responsive text size to prevent iOS zoom', () => {
    render(<Textarea data-testid="responsive-textarea" />);
    const textarea = screen.getByTestId('responsive-textarea');

    // Mobile: text-base (16px) prevents iOS Safari auto-zoom
    // Desktop (sm+): text-sm for consistency with design
    expect(textarea).toHaveClass('text-base');
    expect(textarea).toHaveClass('sm:text-sm');
  });

  it('should have resize and min-height classes', () => {
    render(<Textarea data-testid="resizable-textarea" />);
    const textarea = screen.getByTestId('resizable-textarea');

    expect(textarea).toHaveClass('resize-y');
    expect(textarea).toHaveClass('min-h-[60px]');
  });

  it('should pass through HTML textarea attributes', () => {
    render(
      <Textarea
        placeholder="Enter text"
        disabled
        readOnly
        required
        maxLength={200}
        rows={5}
        data-testid="custom-textarea"
      />,
    );

    const textarea = screen.getByTestId('custom-textarea') as HTMLTextAreaElement;

    expect(textarea.placeholder).toBe('Enter text');
    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
    expect(textarea.required).toBe(true);
    expect(textarea.maxLength).toBe(200);
    expect(textarea.rows).toBe(5);
  });

  it('should merge custom className with default classes', () => {
    render(<Textarea className="custom-class" data-testid="custom-textarea" />);
    const textarea = screen.getByTestId('custom-textarea');

    expect(textarea).toHaveClass('custom-class');
    expect(textarea).toHaveClass('block');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('rounded-md');
  });
});
