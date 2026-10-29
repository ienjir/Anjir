import type { ErrorDef } from './result';

export type DefinedErrors<P extends string, T extends Record<string, ErrorDef>> = {
  readonly [K in keyof T & string]: T[K] & { readonly code: `${P}_${K}` };
};

export type CodesOf<T> = T[keyof T] extends { code: infer C } ? C : never;

export function defineErrors<P extends string, T extends Record<string, ErrorDef>>(prefix: P, defs: T): DefinedErrors<P, T> {
  return Object.fromEntries(
    Object.entries(defs).map(([key, def]) => [key, { ...def, code: `${prefix}_${key}` }]),
  ) as DefinedErrors<P, T>;
}
