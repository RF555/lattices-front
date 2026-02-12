import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ToggleSwitch } from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  it('should render with switch role', () => {
    render(<ToggleSwitch checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should reflect checked state via aria-checked', () => {
    const { rerender } = render(<ToggleSwitch checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');

    rerender(<ToggleSwitch checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('should call onChange with toggled value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} />);

    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('should toggle off when currently checked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToggleSwitch checked={true} onChange={onChange} />);

    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  describe('Keyboard', () => {
    it('should toggle on Space key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={onChange} />);

      screen.getByRole('switch').focus();
      await user.keyboard(' ');
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should toggle on Enter key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={onChange} />);

      screen.getByRole('switch').focus();
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<ToggleSwitch checked={false} onChange={vi.fn()} size="sm" />);
      expect(screen.getByRole('switch')).toHaveClass('h-4', 'w-7');
    });

    it('should render medium size by default', () => {
      render(<ToggleSwitch checked={false} onChange={vi.fn()} />);
      expect(screen.getByRole('switch')).toHaveClass('h-5', 'w-9');
    });
  });

  describe('Disabled', () => {
    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ToggleSwitch checked={false} onChange={onChange} disabled />);

      await user.click(screen.getByRole('switch'));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should have disabled styling', () => {
      render(<ToggleSwitch checked={false} onChange={vi.fn()} disabled />);
      expect(screen.getByRole('switch')).toHaveClass('cursor-not-allowed', 'opacity-50');
    });
  });

  it('should support aria-label via label prop', () => {
    render(<ToggleSwitch checked={false} onChange={vi.fn()} label="Dark mode" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Dark mode');
  });

  it('should have focus styles', () => {
    render(<ToggleSwitch checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('should show primary color when checked', () => {
    render(<ToggleSwitch checked={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveClass('bg-primary');
  });

  it('should show gray when unchecked', () => {
    render(<ToggleSwitch checked={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveClass('bg-gray-300');
  });
});
