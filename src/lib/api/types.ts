export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown> | null;
}

export interface ListResponse<T> {
  data: T[];
  meta?: {
    total: number;
    root_count: number;
  };
}

export interface SingleResponse<T> {
  data: T;
}
