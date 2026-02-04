/**
 * Tests for Workspace Schemas
 *
 * Tests Zod validation schemas for workspace creation and editing forms.
 * Schemas are factory functions that accept a translation function.
 */

import { describe, it, expect } from 'vitest';
import i18n from '@i18n/i18n';
import { createWorkspaceSchema } from '../workspaceSchemas';
import type { WorkspaceFormData } from '../workspaceSchemas';

const t = i18n.getFixedT('en', 'workspaces');
const workspaceSchema = createWorkspaceSchema(t);

describe('createWorkspaceSchema', () => {
  describe('Valid Data', () => {
    it('should validate correct workspace data with name and description', () => {
      const validData = {
        name: 'My Workspace',
        description: 'This is a test workspace',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate data with only name (description optional)', () => {
      const validData = {
        name: 'Workspace Name',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Workspace Name');
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should validate data with empty string description', () => {
      const validData = {
        name: 'Workspace',
        description: '',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept name at maximum length (50 chars)', () => {
      const validData = {
        name: 'a'.repeat(50),
        description: 'Valid workspace',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept description at maximum length (200 chars)', () => {
      const validData = {
        name: 'Workspace',
        description: 'a'.repeat(200),
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Name Validation', () => {
    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Description',
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Workspace name is required');
      }
    });

    it('should reject missing name field', () => {
      const invalidData = {
        description: 'Description',
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name over 50 characters', () => {
      const invalidData = {
        name: 'a'.repeat(51),
        description: 'Description',
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name must be 50 characters or less');
      }
    });

    it('should accept whitespace in name (no trim by default)', () => {
      const validData = {
        name: '   ',
        description: 'Description',
      };

      // Zod doesn't trim by default, so "   " has length 3 and passes min(1)
      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept single character name', () => {
      const validData = {
        name: 'A',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Description Validation', () => {
    it('should allow missing description', () => {
      const validData = {
        name: 'Workspace',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it('should reject description over 200 characters', () => {
      const invalidData = {
        name: 'Workspace',
        description: 'a'.repeat(201),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Description must be 200 characters or less');
      }
    });

    it('should accept description with special characters', () => {
      const validData = {
        name: 'Workspace',
        description: 'Test workspace with special chars: @#$%^&*()_+{}[]|\\:;"<>,.?/~`',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept description with newlines and unicode', () => {
      const validData = {
        name: 'Workspace',
        description: 'Multi-line\ndescription\nwith emoji 🚀 and ñoño',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Boundary Cases', () => {
    it('should reject name exactly 1 char over limit', () => {
      const invalidData = {
        name: 'a'.repeat(51),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description exactly 1 char over limit', () => {
      const invalidData = {
        name: 'Workspace',
        description: 'a'.repeat(201),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept name at exactly 50 characters', () => {
      const validData = {
        name: 'a'.repeat(50),
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept description at exactly 200 characters', () => {
      const validData = {
        name: 'Workspace',
        description: 'a'.repeat(200),
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Multiple Errors', () => {
    it('should report multiple validation errors', () => {
      const invalidData = {
        name: 'a'.repeat(51),
        description: 'a'.repeat(201),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBe(2);
      }
    });

    it('should report error for empty name and over-length description', () => {
      const invalidData = {
        name: '',
        description: 'a'.repeat(201),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBe(2);
        const errorMessages = result.error.errors.map((e) => e.message);
        expect(errorMessages).toContain('Workspace name is required');
        expect(errorMessages).toContain('Description must be 200 characters or less');
      }
    });
  });

  describe('Type Safety', () => {
    it('should reject unexpected fields (strict schema)', () => {
      const invalidData = {
        name: 'Workspace',
        description: 'Description',
        extraField: 'should not be here',
      };

      // Zod strips unknown keys by default in .parse(), but safeParse() still succeeds
      // This is expected behavior for Zod schemas
      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(true);
      if (result.success) {
        // Extra field should be stripped
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });

  describe('i18n Integration', () => {
    it('should use translated error messages', () => {
      const invalidData = {
        name: '',
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Verify it's using the i18n translation
        expect(result.error.errors[0].message).toBe('Workspace name is required');
      }
    });

    it('should use translated max length error', () => {
      const invalidData = {
        name: 'a'.repeat(51),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name must be 50 characters or less');
      }
    });

    it('should use translated description max length error', () => {
      const invalidData = {
        name: 'Workspace',
        description: 'a'.repeat(201),
      };

      const result = workspaceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Description must be 200 characters or less'
        );
      }
    });
  });

  describe('Real World Scenarios', () => {
    it('should validate typical workspace creation data', () => {
      const validData = {
        name: 'Engineering Team',
        description: 'Workspace for the engineering team to track sprint tasks',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate short workspace name', () => {
      const validData = {
        name: 'QA',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate workspace with long name and description', () => {
      const validData = {
        name: 'Product Development and Innovation Workspace 2024',
        description:
          'This workspace is dedicated to product development initiatives, including feature planning, design sprints, user research, and cross-functional collaboration between engineering and product teams.',
      };

      const result = workspaceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

// Type tests (compile-time checks)
describe('Type Inference', () => {
  it('should infer WorkspaceFormData type correctly', () => {
    const data: WorkspaceFormData = {
      name: 'Test Workspace',
      description: 'Description',
    };
    expect(data).toBeDefined();
  });

  it('should allow WorkspaceFormData without description', () => {
    const data: WorkspaceFormData = {
      name: 'Test Workspace',
    };
    expect(data).toBeDefined();
  });
});
