type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

interface AppError {
  code: ErrorCode;
  message: string;
  userMessage?: string;
  cause?: unknown;
}

type ErrorCode =
  | 'GPX_PARSE_FAILED'
  | 'GPX_NO_TRACK'
  | 'FIT_PARSE_FAILED'
  | 'STORAGE_WRITE_FAILED'
  | 'STORAGE_READ_FAILED'
  | 'FILE_TOO_LARGE';
