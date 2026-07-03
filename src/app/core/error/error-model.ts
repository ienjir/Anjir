type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

interface AppError {
  code: ErrorCode;
  message: string;
  userMessage?: string;
  cause?: unknown;
}

type ErrorCode =
  | 'GPX_NONE_OR_TOO_MANY_ROUTES'
  | 'GPX_NONE_OR_TOO_MANY_TRACKS'
  | 'GPX_NO_TRACKSEG_ON_TRACK'
  | 'GPX_NO_TRACKPOINTS_ON_TRACKSEG'
  | 'GPX_EMPTY_SEGMENT';
