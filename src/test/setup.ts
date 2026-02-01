/**
 * Test Setup
 *
 * Configures the test environment with:
 * - jest-dom matchers for better assertions
 * - MSW server lifecycle (beforeAll, afterEach, afterAll)
 * - Cleanup after each test
 * - i18n initialized with English translations for predictable test strings
 */

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';

// Initialize i18n for tests with English locale
import '../i18n/i18n';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset handlers and cleanup after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
});
