import { FitError } from '@import/fit/fit.errors';
import { GpxError } from '@import/gpx/gpx.errors';
import { CodesOf, ErrorParams, interpolate, PlaceholdersOf } from './define-errors';
import { AppError, ErrorDef } from './result';

export type { AppError, ErrorDef, Result } from './result';
export { FitError, GpxError };

// Every error code. Add a new domain by adding its `*.errors.ts` object here
export type ErrorCode = CodesOf<typeof GpxError> | CodesOf<typeof FitError>;

type ErrorInput = ErrorDef & { code: ErrorCode };

// Errors with {placeholders} in their message require a params object, others only take an optional cause
type MakeErrorArgs<D extends ErrorInput> =
  [PlaceholdersOf<D['message']>] extends [never]
    ? [cause?: unknown]
    : [params: Record<PlaceholdersOf<D['message']>, string | number>, cause?: unknown];

export function makeError<D extends ErrorInput>(def: D, ...args: MakeErrorArgs<D>): AppError {
  const hasParams = /\{\w+\}/.test(def.message);
  const params = hasParams ? (args[0] as ErrorParams) : undefined;
  const cause = hasParams ? args[1] : args[0];

  return {
    code: def.code,
    message: params ? interpolate(def.message, params) : def.message,
    userMessage: def.userMessage,
    params,
    cause,
  };
}
