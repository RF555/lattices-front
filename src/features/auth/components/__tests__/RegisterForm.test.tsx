/**
 * Tests for RegisterForm Component
 *
 * Tests form validation, submission, error handling, navigation, and accessibility.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
import { useAuthStore } from '../../stores/authStore';

// Mock react-router navigation
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({
      children,
      to,
      ...props
    }: {
      children: React.ReactNode;
      to: string;
      [key: string]: unknown;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('RegisterForm', () => {
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

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<RegisterForm />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render link to login page', () => {
      render(<RegisterForm />);

      const link = screen.getByRole('link', { name: /sign in/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('Validation', () => {
    it('should prevent submission with empty email', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn();
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      // Try to submit without filling email
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should not call register due to validation error
      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission with invalid email format', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn();
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should not call register due to invalid email
      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission with password less than 8 characters', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn();
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should not call register due to short password
      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission with empty confirm password', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn();
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should not call register due to missing confirm password
      await waitFor(() => {
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    it('should show validation error for mismatched passwords', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn();
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'different123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for validation error to appear
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Should not call register
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should allow submission with valid form data', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Should call register with valid data
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });

  describe('Submission', () => {
    it('should call register on valid form submission', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/name \(optional\)/i), 'John Doe');
      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        });
      });
    });

    it('should call register without name when name field is empty', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          name: undefined,
        });
      });
    });

    it('should navigate to /app on successful registration', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/app', { replace: true });
      });
    });

    it('should show loading state during registration', async () => {
      const user = userEvent.setup();
      let resolveRegister: () => void;
      const mockRegister = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRegister = resolve;
          })
      );

      useAuthStore.setState({ register: mockRegister, isLoading: false });
      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const clickPromise = user.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for the store to be called
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });

      // Set loading state to simulate what the store does
      useAuthStore.setState({ isLoading: true });

      // Check loading state
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /loading/i })).toBeInTheDocument();
      });

      // Resolve the registration
      resolveRegister!();
      await clickPromise;
    });

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();
      useAuthStore.setState({ error: 'Previous error' });
      const mockClearError = vi.fn();
      const mockRegister = vi.fn().mockResolvedValue(undefined);
      useAuthStore.setState({ register: mockRegister, clearError: mockClearError });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display registration error from store', () => {
      useAuthStore.setState({ error: 'Email already exists' });
      render(<RegisterForm />);

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    it('should not display error when error is null', () => {
      useAuthStore.setState({ error: null });
      render(<RegisterForm />);

      expect(screen.queryByText(/email already exists/i)).not.toBeInTheDocument();
    });

    it('should handle registration failure gracefully', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
      useAuthStore.setState({
        register: mockRegister,
        error: 'Registration failed',
      });

      render(<RegisterForm />);

      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Error should be shown from store
      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name \(optional\)/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
    });

    it('should have autocomplete attributes', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name \(optional\)/i)).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText(/^email$/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name \(optional\)/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Tab through form
      await user.tab();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(confirmPasswordInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should display validation errors with accessible text styling', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn();
      useAuthStore.setState({ register: mockRegister });

      render(<RegisterForm />);

      // Submit with mismatched passwords to trigger a visible error
      await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'differentPassword');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Wait for the mismatch error to appear
      await waitFor(() => {
        const errorMessage = screen.getByText(/passwords do not match/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('text-red-600');
      });

      // Should not call register
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });
});
