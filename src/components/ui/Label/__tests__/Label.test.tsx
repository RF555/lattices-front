import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Label } from '../Label';

describe('Label', () => {
  it('should render text content', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should apply htmlFor attribute', () => {
    render(<Label htmlFor="email-field">Email</Label>);
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-field');
  });

  it('should forward ref', () => {
    const ref = vi.fn();
    render(<Label ref={ref}>Label</Label>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLLabelElement));
  });

  it('should merge custom className', () => {
    render(<Label className="text-red-500">Error Label</Label>);
    const label = screen.getByText('Error Label');
    expect(label).toHaveClass('text-red-500');
    expect(label).toHaveClass('text-sm', 'font-medium');
  });

  it('should have default styling', () => {
    render(<Label>Default</Label>);
    const label = screen.getByText('Default');
    expect(label).toHaveClass('block', 'text-sm', 'font-medium', 'text-gray-700');
  });

  it('should render as a label element', () => {
    render(<Label>Test</Label>);
    expect(screen.getByText('Test').tagName).toBe('LABEL');
  });
});
