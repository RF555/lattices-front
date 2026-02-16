import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { VisuallyHidden } from '../VisuallyHidden';

describe('VisuallyHidden', () => {
  it('should render children', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    expect(screen.getByText('Hidden text')).toBeInTheDocument();
  });

  it('should render as a span element', () => {
    render(<VisuallyHidden>Test</VisuallyHidden>);
    expect(screen.getByText('Test').tagName).toBe('SPAN');
  });

  it('should have visually hidden styles', () => {
    render(<VisuallyHidden>SR only</VisuallyHidden>);
    const el = screen.getByText('SR only');
    expect(el).toHaveClass('absolute', 'w-px', 'h-px', 'overflow-hidden');
  });

  it('should have clip rect style for full visual hiding', () => {
    render(<VisuallyHidden>Clipped</VisuallyHidden>);
    const el = screen.getByText('Clipped');
    expect(el.style.clip).toBe('rect(0px, 0px, 0px, 0px)');
  });

  it('should be accessible to screen readers', () => {
    render(
      <div>
        <button>
          Delete
          <VisuallyHidden>item 5</VisuallyHidden>
        </button>
      </div>,
    );
    // The text is in the DOM and accessible
    expect(screen.getByText('item 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete item 5/i })).toBeInTheDocument();
  });
});
