import { FitError } from '@import/fit/fit.errors';
import { GpxError } from '@import/gpx/gpx.errors';
import { CodesOf } from './define-errors';
import { AppError, ErrorDef } from './result';

export type { AppError, ErrorDef, Result } from './result';
export { FitError, GpxError };

// Every error code. Add a new domain by adding its `*.errors.ts` object here
export type ErrorCode = CodesOf<typeof GpxError> | CodesOf<typeof FitError>;

export function makeError(def: ErrorDef & { code: ErrorCode }, cause?: unknown): AppError {
  return { code: def.code, message: def.message, userMessage: def.userMessage, cause };
}
