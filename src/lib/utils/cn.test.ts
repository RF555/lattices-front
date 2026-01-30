/**
 * Tests for cn (className utility)
 *
 * Tests the combination of clsx and tailwind-merge for managing Tailwind CSS classes.
 */

import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('should merge multiple class names', () => {
    const result = cn('px-2 py-1', 'text-red-500');
    expect(result).toBe('px-2 py-1 text-red-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn('base-class', isActive && 'active', isDisabled && 'disabled');
    expect(result).toBe('base-class active');
  });

  it('should merge conflicting Tailwind classes correctly', () => {
    // twMerge should keep the last class when there are conflicts
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['px-2', 'py-1'], 'text-red-500');
    expect(result).toBe('px-2 py-1 text-red-500');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'px-2': true,
      'py-1': true,
      'text-red-500': false,
    });
    expect(result).toBe('px-2 py-1');
  });

  it('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge complex Tailwind classes', () => {
    // Test with responsive and variant modifiers
    const result = cn('p-2 hover:p-4', 'p-3 focus:p-5');
    // p-3 should override p-2, but hover and focus should remain
    expect(result).toBe('hover:p-4 p-3 focus:p-5');
  });

  it('should handle multiple conflicting classes', () => {
    const result = cn('text-sm text-base text-lg');
    expect(result).toBe('text-lg');
  });

  it('should preserve non-conflicting utility classes', () => {
    const result = cn('px-2 py-1', 'px-4 bg-blue-500');
    expect(result).toBe('py-1 px-4 bg-blue-500');
  });
});
