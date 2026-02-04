import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render with dialog role when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should render title', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('should not render title element when title is not provided', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Content</div>
      </Modal>
    );

    // Title should not be in the document
    const h2Elements = container.querySelectorAll('h2');
    expect(h2Elements.length).toBe(0);
  });

  it('should render children', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);

    // Click the backdrop (the outer div with role="presentation")
    const backdrop = screen.getByRole('presentation');
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when dialog content is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);

    // Click the dialog itself
    const dialog = screen.getByRole('dialog');
    await user.click(dialog);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    await user.type(dialog, '{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have aria-modal attribute set to true', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should have aria-label set to title', () => {
    render(<Modal {...defaultProps} title="Accessible Title" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Accessible Title');
  });

  it('should be focusable with tabIndex -1', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('tabIndex', '-1');
  });

  it('should apply custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal-class" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom-modal-class');
  });

  it('should merge custom className with default classes', () => {
    render(<Modal {...defaultProps} className="custom-modal-class" />);
    const dialog = screen.getByRole('dialog');

    // Should have both default and custom classes
    expect(dialog).toHaveClass('custom-modal-class');
    expect(dialog).toHaveClass('bg-white');
    expect(dialog).toHaveClass('rounded-lg');
    expect(dialog).toHaveClass('shadow-xl');
  });

  it('should trap focus within modal for Tab key', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Test">
        <button>First Button</button>
        <button>Second Button</button>
        <button>Third Button</button>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    // Focus the dialog first
    dialog.focus();

    // Tab to first button
    await user.tab();
    expect(firstButton).toHaveFocus();

    // Tab to last button
    await user.tab();
    await user.tab();
    expect(lastButton).toHaveFocus();

    // Tab from last button should wrap to first
    await user.tab();
    expect(firstButton).toHaveFocus();
  });

  it('should trap focus for Shift+Tab (reverse)', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap Test">
        <button>First Button</button>
        <button>Second Button</button>
        <button>Third Button</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button');
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    // Focus first button
    firstButton.focus();
    expect(firstButton).toHaveFocus();

    // Shift+Tab from first button should wrap to last
    await user.tab({ shift: true });
    expect(lastButton).toHaveFocus();
  });

  it('should render backdrop with correct styling', () => {
    render(<Modal {...defaultProps} />);
    const backdrop = screen.getByRole('presentation');

    expect(backdrop).toHaveClass('fixed');
    expect(backdrop).toHaveClass('inset-0');
    expect(backdrop).toHaveClass('z-50');
    expect(backdrop).toHaveClass('bg-black/50');
  });

  it('should render dialog with correct positioning', () => {
    render(<Modal {...defaultProps} />);
    const backdrop = screen.getByRole('presentation');

    expect(backdrop).toHaveClass('flex');
    expect(backdrop).toHaveClass('items-center');
    expect(backdrop).toHaveClass('justify-center');
  });

  it('should render multiple children', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Multiple Children">
        <div>First child</div>
        <div>Second child</div>
        <div>Third child</div>
      </Modal>
    );

    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });
});
