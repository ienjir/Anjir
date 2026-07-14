type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

interface AppError {
  code: ErrorCode;
  message: string;
  userMessage?: string;
  cause?: unknown;
}

enum ErrorCode {
  // Gpx errors
  GPX_NO_ROUTES,
  GPX_NO_TRACKS,
  GPX_NO_TRKSEG,
  GPX_NO_TRKPNT,
  GPX_EMPTY_SEG,
  GPX_UND_TRKPNT,
  GPX_NO_TMPSTMP,
  GPX_NO_VLD_TRK_DTA,
}
