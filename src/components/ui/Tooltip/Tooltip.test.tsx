import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('should render children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
  });

  it('should show tooltip on focus', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Focus text">
        <button>Focus me</button>
      </Tooltip>,
    );

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Focus text');
    });
  });

  it('should dismiss tooltip on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Dismiss me">
        <button>Focus me</button>
      </Tooltip>,
    );

    // Open via focus
    await user.tab();
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    // Dismiss via Escape
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  it('should render only children when content is empty', () => {
    render(
      <Tooltip content="">
        <button>No tooltip</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'No tooltip' })).toBeInTheDocument();
  });

  it('should not show tooltip when enabled is false', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Hidden" enabled={false}>
        <button>Disabled tooltip</button>
      </Tooltip>,
    );

    // Focus the button — tooltip should not appear since enabled=false
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    // Give time for tooltip to potentially appear
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should preserve child focus when enabled toggles', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Tooltip content="Tip" enabled={true}>
        <button>Toggle me</button>
      </Tooltip>,
    );

    const button = screen.getByRole('button');
    await user.click(button);
    expect(button).toHaveFocus();

    // Toggle enabled to false — button should keep focus
    rerender(
      <Tooltip content="Tip" enabled={false}>
        <button>Toggle me</button>
      </Tooltip>,
    );

    expect(screen.getByRole('button', { name: 'Toggle me' })).toHaveFocus();
  });
});
