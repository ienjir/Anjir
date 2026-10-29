import type { ErrorCode } from './index';

export type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

export interface ErrorDef {
  message: string;
  userMessage: string;
}

export interface AppError extends ErrorDef {
  code: ErrorCode;
  cause?: unknown;
}
