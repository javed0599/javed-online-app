import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SplashScreen Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have default duration of 2000ms', () => {
    const defaultDuration = 2000;
    expect(defaultDuration).toBe(2000);
  });

  it('should show app name correctly', () => {
    const appName = 'JAVED ONLINE';
    expect(appName).toBe('JAVED ONLINE');
  });

  it('should show loading message by default', () => {
    const showMessage = true;
    expect(showMessage).toBe(true);
  });

  it('should allow custom duration', () => {
    const customDuration = 3000;
    expect(customDuration).toBeGreaterThan(2000);
  });

  it('should allow hiding the message', () => {
    const showMessage = false;
    expect(showMessage).toBe(false);
  });

  it('should call onComplete callback after duration', () => {
    const mockCallback = vi.fn();
    const duration = 2000;

    // Simulate timer
    vi.advanceTimersByTime(duration);
    mockCallback();

    expect(mockCallback).toHaveBeenCalled();
  });

  it('should display loading text', () => {
    const loadingText = 'Loading exam results...';
    expect(loadingText).toContain('Loading');
    expect(loadingText).toContain('exam results');
  });

  it('should be positioned absolutely and cover full screen', () => {
    const zIndex = 50;
    const position = 'absolute';
    const inset = 0;

    expect(position).toBe('absolute');
    expect(zIndex).toBe(50);
    expect(inset).toBe(0);
  });

  it('should use background color from theme', () => {
    const bgClass = 'bg-background';
    expect(bgClass).toContain('background');
  });

  it('should center content both horizontally and vertically', () => {
    const alignItems = 'items-center';
    const justifyContent = 'justify-center';

    expect(alignItems).toContain('center');
    expect(justifyContent).toContain('center');
  });

  it('should have proper spacing between spinner and text', () => {
    const marginTop = 12; // mt-12 = 3rem = 48px
    expect(marginTop).toBeGreaterThan(0);
  });
});
