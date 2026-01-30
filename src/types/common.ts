// Shared common types
export type Nullable<T> = T | null;

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}
