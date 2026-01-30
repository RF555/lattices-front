/**
 * Tests for Auth Schemas
 *
 * Tests Zod validation schemas for login and registration forms.
 */

import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './authSchemas';
import type { LoginFormData, RegisterFormData } from './authSchemas';

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Please enter a valid email address');
    }
  });

  it('should reject empty email', () => {
    const invalidData = {
      email: '',
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Please enter a valid email address');
    }
  });

  it('should reject missing password', () => {
    const invalidData = {
      email: 'test@example.com',
      password: '',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Password is required');
    }
  });

  it('should reject missing email field', () => {
    const invalidData = {
      password: 'password123',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept valid email with various formats', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user_name@sub.example.org',
    ];

    for (const email of validEmails) {
      const result = loginSchema.safeParse({ email, password: 'pass' });
      expect(result.success).toBe(true);
    }
  });
});

describe('registerSchema', () => {
  it('should validate correct registration data', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should validate registration without name (optional)', () => {
    const validData = {
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject password shorter than 8 characters', () => {
    const invalidData = {
      email: 'john@example.com',
      password: 'pass',
      confirmPassword: 'pass',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('should reject when passwords do not match', () => {
    const invalidData = {
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) => e.path.includes('confirmPassword'));
      expect(error?.message).toBe('Passwords do not match');
    }
  });

  it('should reject invalid email format', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Please enter a valid email address');
    }
  });

  it('should reject empty confirmPassword', () => {
    const invalidData = {
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: '',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Please confirm your password');
    }
  });

  it('should accept minimum valid password length', () => {
    const validData = {
      email: 'john@example.com',
      password: '12345678',
      confirmPassword: '12345678',
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should handle multiple validation errors', () => {
    const invalidData = {
      email: 'invalid',
      password: 'short',
      confirmPassword: 'different',
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(1);
    }
  });
});

// Type tests (compile-time checks)
describe('Type Inference', () => {
  it('should infer LoginFormData type correctly', () => {
    const data: LoginFormData = {
      email: 'test@example.com',
      password: 'password',
    };
    expect(data).toBeDefined();
  });

  it('should infer RegisterFormData type correctly', () => {
    const data: RegisterFormData = {
      name: 'John',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };
    expect(data).toBeDefined();
  });
});
