/** Common HTTP status codes used in the application */
export const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
} as const;

/** Standard HTTP header values */
export const HTTP_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  AUTH_PREFIX: 'Bearer',
} as const;

/** Backend API paths (outside versioned routes) */
export const API_PATHS = {
  HEALTH: '/health',
} as const;
