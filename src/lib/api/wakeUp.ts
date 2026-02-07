const API_URL = import.meta.env.VITE_API_URL;
const HEALTH_CHECK_TIMEOUT = 10_000;
const MAX_RETRIES = 10;
const RETRY_DELAY = 2000;

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
  if (state.isAwake && Date.now() - state.lastCheck < 60000) {
    return true;
  }

  state.isWakingUp = true;

  wakeUpPromise = (async () => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
        });
        if (response.ok) {
          state.isAwake = true;
          state.lastCheck = Date.now();
          return true;
        }
      } catch {
        // timeout or network error, retry
      }
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
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
