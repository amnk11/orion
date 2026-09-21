import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { connectivity } from './connectivity';

const originalFetch = global.fetch;

describe('ConnectivityMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset internal state by recreating it isn't easy since it's a singleton export.
    // We'll mock navigator and dispatch events.
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('offline event updates connectivity state', () => {
    const listener = vi.fn();
    const unsubscribe = connectivity.subscribe(listener);
    
    window.dispatchEvent(new Event('offline'));
    expect(connectivity.status).toBe('offline');
    expect(listener).toHaveBeenCalledWith('offline');
    
    unsubscribe();
  });

  it('online event triggers probe and updates connectivity state', async () => {
    // Start offline
    window.dispatchEvent(new Event('offline'));
    expect(connectivity.status).toBe('offline');

    const listener = vi.fn();
    const unsubscribe = connectivity.subscribe(listener);

    // Now online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    
    // It should go checking then online (if fetch resolves)
    expect(global.fetch).toHaveBeenCalledWith('/api/health', { cache: 'no-store', method: 'HEAD' });
    
    // Resolve pending promises
    await vi.runAllTimersAsync();
    
    expect(connectivity.status).toBe('online');
    unsubscribe();
  });

  it('failed health probe does not incorrectly report a healthy connection', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    
    await vi.runAllTimersAsync();
    
    expect(connectivity.status).toBe('offline');
  });

  it('listeners are cleaned up correctly', () => {
    const listener = vi.fn();
    const unsubscribe = connectivity.subscribe(listener);
    
    unsubscribe();
    window.dispatchEvent(new Event('offline'));
    // The listener was called once initially during subscribe.
    expect(listener).toHaveBeenCalledTimes(1); 
  });
});
