export interface CursorMeta {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: CursorMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiResponseError {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export interface CursorPage<T> {
  items: T[];
  meta: CursorMeta;
}
