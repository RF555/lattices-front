import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { LanguageSwitcher } from '../LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('should render EN and Hebrew buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('עב')).toBeInTheDocument();
  });

  it('should mark active language with aria-pressed="true"', () => {
    render(<LanguageSwitcher />);
    // Test setup initializes i18n with English
    const enButton = screen.getByText('EN');
    expect(enButton).toHaveAttribute('aria-pressed', 'true');

    const heButton = screen.getByText('עב');
    expect(heButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should have primary styling on active language', () => {
    render(<LanguageSwitcher />);
    const enButton = screen.getByText('EN');
    expect(enButton).toHaveClass('bg-primary', 'text-white');
  });

  it('should have inactive styling on non-active language', () => {
    render(<LanguageSwitcher />);
    const heButton = screen.getByText('עב');
    expect(heButton).toHaveClass('text-gray-500');
  });

  it('should call changeLanguage on click', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByText('עב'));
    expect(i18n.resolvedLanguage).toBe('he');

    // Switch back to English for other tests
    await user.click(screen.getByText('EN'));
    expect(i18n.resolvedLanguage).toBe('en');
  });

  it('should render all buttons with type="button"', () => {
    render(<LanguageSwitcher />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
