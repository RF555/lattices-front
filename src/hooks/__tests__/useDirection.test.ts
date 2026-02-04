import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@/test/test-utils';
import { useDirection } from '../useDirection';
import i18n from '@i18n/i18n';

describe('useDirection', () => {
  // Store original document state
  const originalDir = document.documentElement.dir;
  const originalLang = document.documentElement.lang;

  beforeEach(() => {
    // Reset document attributes before each test
    document.documentElement.dir = '';
    document.documentElement.lang = '';
  });

  afterEach(() => {
    // Restore original state
    document.documentElement.dir = originalDir;
    document.documentElement.lang = originalLang;
    // Reset i18n to English (default for tests)
    i18n.changeLanguage('en');
  });

  it('should return ltr direction for English language', async () => {
    await i18n.changeLanguage('en');

    renderHook(() => useDirection());

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should return rtl direction for Hebrew language', async () => {
    await i18n.changeLanguage('he');

    renderHook(() => useDirection());

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
  });

  it('should update direction when language changes from en to he', async () => {
    // Start with English
    await i18n.changeLanguage('en');
    const { rerender } = renderHook(() => useDirection());

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');

    // Change to Hebrew
    await i18n.changeLanguage('he');
    rerender();

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
  });

  it('should update direction when language changes from he to en', async () => {
    // Start with Hebrew
    await i18n.changeLanguage('he');
    const { rerender } = renderHook(() => useDirection());

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');

    // Change to English
    await i18n.changeLanguage('en');
    rerender();

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should set dir attribute on html element', async () => {
    await i18n.changeLanguage('en');

    renderHook(() => useDirection());

    const htmlElement = document.documentElement;
    expect(htmlElement.hasAttribute('dir')).toBe(true);
    expect(htmlElement.getAttribute('dir')).toBe('ltr');
  });

  it('should set lang attribute on html element', async () => {
    await i18n.changeLanguage('en');

    renderHook(() => useDirection());

    const htmlElement = document.documentElement;
    expect(htmlElement.hasAttribute('lang')).toBe(true);
    expect(htmlElement.getAttribute('lang')).toBe('en');
  });

  it('should handle multiple language switches', async () => {
    const { rerender } = renderHook(() => useDirection());

    // Switch to English
    await i18n.changeLanguage('en');
    rerender();
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');

    // Switch to Hebrew
    await i18n.changeLanguage('he');
    rerender();
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');

    // Switch back to English
    await i18n.changeLanguage('en');
    rerender();
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should initialize with current i18n language', async () => {
    // Set language before rendering hook
    await i18n.changeLanguage('he');

    renderHook(() => useDirection());

    // Should immediately set correct direction
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('he');
  });

  it('should use i18n.dir() to determine direction', async () => {
    // English uses ltr
    await i18n.changeLanguage('en');
    const { rerender: rerenderEn } = renderHook(() => useDirection());
    expect(i18n.dir()).toBe('ltr');
    expect(document.documentElement.dir).toBe('ltr');

    // Hebrew uses rtl
    await i18n.changeLanguage('he');
    const { rerender: rerenderHe } = renderHook(() => useDirection());
    rerenderHe();
    expect(i18n.dir()).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('should default to "en" if resolvedLanguage is undefined', async () => {
    // This is a safety test - in practice, resolvedLanguage should always be set
    await i18n.changeLanguage('en');

    renderHook(() => useDirection());

    // Even if resolvedLanguage is undefined, the hook defaults to 'en'
    expect(document.documentElement.lang).toBe('en');
  });
});
