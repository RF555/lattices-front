/**
 * Tests for LoginForm Component
 *
 * Tests form validation, submission, error handling, and navigation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { useAuthStore } from '../stores/authStore';

// Mock react-router navigation
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
    mockNavigate.mockClear();
  });

  it('should render login form fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render link to sign up', () => {
    render(<LoginForm />);

    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/auth/register');
  });

  describe('Validation', () => {
    it('should prevent submission with invalid data', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();
      useAuthStore.setState({ login: mockLogin });

      render(<LoginForm />);

      // Try to submit without filling fields
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Login should not be called
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    it('should allow submission with valid data', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ login: mockLogin });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Login should be called with valid data
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Submission', () => {
    it('should call login on valid form submission', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ login: mockLogin });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to /app on successful login', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ login: mockLogin });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true });
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const mockLogin = vi.fn(
        () => new Promise<void>((resolve) => {
          resolveLogin = resolve;
        })
      );

      // Set initial state with isLoading false
      useAuthStore.setState({ login: mockLogin, isLoading: false });
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Start the login process
      const clickPromise = user.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for the store to be called and update loading state
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Set loading state to simulate what the store does
      useAuthStore.setState({ isLoading: true });

      // Check loading state
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /loading/i })).toBeInTheDocument();
      });

      // Resolve the login
      resolveLogin!();
      await clickPromise;
    });

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({ error: 'Previous error' });
      const mockClearError = vi.fn();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ login: mockLogin, clearError: mockClearError });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display login error from store', () => {
      useAuthStore.setState({ error: 'Invalid credentials' });
      render(<LoginForm />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      useAuthStore.setState({ error: null });
      render(<LoginForm />);

      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });

    it('should handle login failure gracefully', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Login failed'));
      useAuthStore.setState({
        login: mockLogin,
        error: 'Login failed',
      });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should be shown from store
      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have autocomplete attributes', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'current-password');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab through form
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });
});
