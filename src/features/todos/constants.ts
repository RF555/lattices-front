/** Available sort fields for the todo list */
export const SORT_FIELDS = {
  POSITION: 'position',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  TITLE: 'title',
} as const;

export type SortField = (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS];

/** Available sort orders */
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

/** Default values for todo operations */
export const TODO_DEFAULTS = {
  /** Position used for optimistic updates before server assigns real position */
  OPTIMISTIC_POSITION: 999,
} as const;
