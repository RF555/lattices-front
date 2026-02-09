import { WAKE_UP, API_PATHS } from '@/constants';

const API_URL = import.meta.env.VITE_API_URL;

interface WakeUpState {
  isWakingUp: boolean;
  isAwake: boolean;
  lastCheck: number;
}

const state: WakeUpState = {
  isWakingUp: false,
  isAwake: false,
  lastCheck: 0,
};

let wakeUpPromise: Promise<boolean> | null = null;

export async function wakeUpBackend(): Promise<boolean> {
  // Return cached promise if already in progress
  if (wakeUpPromise) return wakeUpPromise;

  // Skip if recently checked
  if (state.isAwake && Date.now() - state.lastCheck < WAKE_UP.CACHE_THRESHOLD_MS) {
    return true;
  }

  state.isWakingUp = true;

  wakeUpPromise = (async () => {
    for (let attempt = 0; attempt < WAKE_UP.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_URL}${API_PATHS.HEALTH}`, {
          method: 'GET',
          signal: AbortSignal.timeout(WAKE_UP.TIMEOUT_MS),
        });
        if (response.ok) {
          state.isAwake = true;
          state.lastCheck = Date.now();
          return true;
        }
      } catch {
        // timeout or network error, retry
      }
      if (attempt < WAKE_UP.MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, WAKE_UP.RETRY_DELAY_MS));
      }
    }
    state.isAwake = false;
    return false;
  })().finally(() => {
    state.isWakingUp = false;
    wakeUpPromise = null;
  });

  return wakeUpPromise;
}

export function getIsWakingUp(): boolean {
  return state.isWakingUp;
}

export function getIsAwake(): boolean {
  return state.isAwake;
}
