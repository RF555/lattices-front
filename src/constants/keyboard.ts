/**
 * Centralized keyboard shortcut keys.
 * Used by useTreeKeyboard, NotificationBell, and Modal.
 */
export const KEYS = {
  NAV_DOWN: ['ArrowDown', 'j'],
  NAV_UP: ['ArrowUp', 'k'],
  NAV_RIGHT: ['ArrowRight', 'l'],
  NAV_LEFT: ['ArrowLeft', 'h'],
  TOGGLE_COMPLETE: ['Enter', ' '],
  DELETE: ['Delete', 'Backspace'],
  NEW_TODO: 'n',
  CANCEL: 'Escape',
  FOCUS_TRAP_CYCLE: 'Tab',
  HOME: 'Home',
  END: 'End',
  TOGGLE_NOTIFICATIONS: 'n',
} as const;

/** DOM element IDs for programmatic focus */
export const ELEMENT_IDS = {
  CREATE_TODO_INPUT: 'create-todo-input',
} as const;
