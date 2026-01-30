const API_URL = import.meta.env.VITE_API_URL;
const HEALTH_CHECK_TIMEOUT = 3000;

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

  wakeUpPromise = fetch(`${API_URL}/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
  })
    .then((response) => {
      state.isAwake = response.ok;
      state.lastCheck = Date.now();
      return response.ok;
    })
    .catch(() => {
      state.isAwake = false;
      return false;
    })
    .finally(() => {
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
