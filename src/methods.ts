import type { Result } from "./result-type";

/**
 * Matches on a Result, calling the appropriate handler based on whether it's Ok or Err.
 *
 * @param result - The Result to match on
 * @param handlers - Object containing handler functions for Ok and Err cases
 * @param handlers.ok - Function to call if the result is Ok
 * @param handlers.err - Function to call if the result is Err
 * @returns The return value from the called handler function
 */
export function match<T, E, OK, ERR>(
  result: Result<T, E>,
  {
    ok,
    err,
  }: {
    ok(value: T): OK;
    err(error: E): ERR;
  }
): OK | ERR {
  return result.kind === "ok" ? ok(result.inner) : err(result.inner);
}

/**
 * Returns `true` if the result is `Ok`.
 *
 * @param result - The Result to check
 * @returns `true` if the result is `Ok`, `false` otherwise
 */
export function isOk<T, E>(
  result: Result<T, E>
): result is { kind: "ok"; inner: T } {
  return result.kind === "ok";
}

/**
 * Returns `true` if the result is `Ok` and the value inside matches a predicate.
 *
 * @param result - The Result to check
 * @param predicate - A function that tests the Ok value
 * @returns `true` if the result is `Ok` and the predicate returns `true`
 */
export function isOkAnd<T, E>(
  result: Result<T, E>,
  predicate: (value: T) => boolean
): boolean {
  return result.kind === "ok" && predicate(result.inner);
}

/**
 * Returns `true` if the result is `Err`.
 *
 * @param result - The Result to check
 * @returns `true` if the result is `Err`, `false` otherwise
 */
export function isErr<T, E>(
  result: Result<T, E>
): result is { kind: "err"; inner: E } {
  return result.kind === "err";
}

/**
 * Returns `true` if the result is `Err` and the error inside matches a predicate.
 *
 * @param result - The Result to check
 * @param predicate - A function that tests the Err value
 * @returns `true` if the result is `Err` and the predicate returns `true`
 */
export function isErrAnd<T, E>(
  result: Result<T, E>,
  predicate: (error: E) => boolean
): boolean {
  return result.kind === "err" && predicate(result.inner);
}

/**
 * Converts from `Result<T, E>` to `T | undefined`.
 * Returns the Ok value if present, otherwise `undefined`.
 *
 * @param result - The Result to extract value from
 * @returns The Ok value or `undefined`
 */
export function resultOk<T, E>(result: Result<T, E>): T | undefined {
  return result.kind === "ok" ? result.inner : undefined;
}

/**
 * Converts from `Result<T, E>` to `E | undefined`.
 * Returns the Err value if present, otherwise `undefined`.
 *
 * @param result - The Result to extract error from
 * @returns The Err value or `undefined`
 */
export function resultErr<T, E>(result: Result<T, E>): E | undefined {
  return result.kind === "err" ? result.inner : undefined;
}

/**
 * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained `Ok` value,
 * leaving an `Err` value untouched.
 *
 * This function can be used to compose the results of two functions.
 *
 * @param result - The Result to map
 * @param fn - A function to apply to the Ok value
 * @returns A new Result with the transformed Ok value or the original Err
 */
export function map<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return result.kind === "ok"
    ? { kind: "ok", inner: fn(result.inner) }
    : result;
}

/**
 * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
 *
 * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call,
 * it is recommended to use `mapOrElse`, which is lazily evaluated.
 *
 * @param result - The Result to map
 * @param defaultValue - The default value to return if the result is Err
 * @param fn - A function to apply to the Ok value
 * @returns The result of applying fn to the Ok value or the default value
 */
export function mapOr<T, E, U>(
  result: Result<T, E>,
  defaultValue: U,
  fn: (value: T) => U
): U {
  return result.kind === "ok" ? fn(result.inner) : defaultValue;
}

/**
 * Maps a `Result<T, E>` to `U` by applying fallback function `fallback` to a contained `Err` value,
 * or function `fn` to a contained `Ok` value.
 *
 * This function can be used to unpack a successful result while handling an error.
 *
 * @param result - The Result to map
 * @param fallback - A function to apply to the Err value
 * @param fn - A function to apply to the Ok value
 * @returns The result of applying the appropriate function
 */
export function mapOrElse<T, E, U>(
  result: Result<T, E>,
  fallback: (error: E) => U,
  fn: (value: T) => U
): U {
  return result.kind === "ok" ? fn(result.inner) : fallback(result.inner);
}

/**
 * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained `Err` value,
 * leaving an `Ok` value untouched.
 *
 * This function can be used to pass through a successful result while handling an error.
 *
 * @param result - The Result to map
 * @param fn - A function to apply to the Err value
 * @returns A new Result with the transformed Err value or the original Ok
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return result.kind === "err"
    ? { kind: "err", inner: fn(result.inner) }
    : result;
}

/**
 * Calls the provided closure with the contained value (if `Ok`).
 *
 * @param result - The Result to inspect
 * @param fn - A function to call with the Ok value
 * @returns The original result unchanged
 */
export function inspect<T, E>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E> {
  if (result.kind === "ok") {
    fn(result.inner);
  }
  return result;
}

/**
 * Calls the provided closure with the contained error (if `Err`).
 *
 * @param result - The Result to inspect
 * @param fn - A function to call with the Err value
 * @returns The original result unchanged
 */
export function inspectErr<T, E>(
  result: Result<T, E>,
  fn: (error: E) => void
): Result<T, E> {
  if (result.kind === "err") {
    fn(result.inner);
  }
  return result;
}

/**
 * Returns the contained `Ok` value.
 *
 * @param result - The Result to unwrap
 * @param message - The error message to throw if the result is Err
 * @returns The Ok value
 * @throws Error with the provided message if the result is Err
 */
export function expect<T, E>(result: Result<T, E>, message: string): T {
  if (result.kind === "ok") {
    return result.inner;
  }
  throw new Error(message);
}

/**
 * Returns the contained `Ok` value.
 *
 * Because this function may throw, its use is generally discouraged.
 * Instead, prefer to use pattern matching and handle the `Err` case explicitly,
 * or call `unwrapOr`, `unwrapOrElse`.
 *
 * @param result - The Result to unwrap
 * @returns The Ok value
 * @throws Error if the result is Err
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.kind === "ok") {
    return result.inner;
  }
  throw new Error("Called unwrap on an Err value");
}

/**
 * Returns the contained `Ok` value or a provided default.
 *
 * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call,
 * it is recommended to use `unwrapOrElse`, which is lazily evaluated.
 *
 * @param result - The Result to unwrap
 * @param defaultValue - The default value to return if the result is Err
 * @returns The Ok value or the default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.kind === "ok" ? result.inner : defaultValue;
}

/**
 * Returns the contained `Ok` value or computes it from a closure.
 *
 * @param result - The Result to unwrap
 * @param fn - A function to compute the default value from the Err value
 * @returns The Ok value or the result of calling fn with the Err value
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  return result.kind === "ok" ? result.inner : fn(result.inner);
}

/**
 * Returns the contained `Err` value.
 *
 * @param result - The Result to unwrap
 * @param message - The error message to throw if the result is Ok
 * @returns The Err value
 * @throws Error with the provided message if the result is Ok
 */
export function expectErr<T, E>(result: Result<T, E>, message: string): E {
  if (result.kind === "err") {
    return result.inner;
  }
  throw new Error(message);
}

/**
 * Returns the contained `Err` value.
 *
 * @param result - The Result to unwrap
 * @returns The Err value
 * @throws Error if the result is Ok
 */
export function unwrapErr<T, E>(result: Result<T, E>): E {
  if (result.kind === "err") {
    return result.inner;
  }
  throw new Error("Called unwrapErr on an Ok value");
}

/**
 * Returns `other` if the result is `Ok`, otherwise returns the `Err` value of `result`.
 *
 * @param result - The first Result
 * @param other - The second Result to return if the first is Ok
 * @returns The second result if the first is Ok, otherwise the first result
 */
export function and<T, E, U>(
  result: Result<T, E>,
  other: Result<U, E>
): Result<U, E> {
  return result.kind === "ok" ? other : result;
}

/**
 * Calls `fn` if the result is `Ok`, otherwise returns the `Err` value of `result`.
 *
 * This function can be used for control flow based on `Result` values.
 *
 * @param result - The Result to chain
 * @param fn - A function to call with the Ok value that returns a new Result
 * @returns The result of calling fn or the original Err
 */
export function andThen<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return result.kind === "ok" ? fn(result.inner) : result;
}

/**
 * Returns the result if it contains a value, otherwise returns `other`.
 *
 * @param result - The first Result
 * @param other - The second Result to return if the first is Err
 * @returns The first result if it's Ok, otherwise the second result
 */
export function or<T, E, F>(
  result: Result<T, E>,
  other: Result<T, F>
): Result<T, F> {
  return result.kind === "ok" ? result : other;
}

/**
 * Calls `fn` if the result is `Err`, otherwise returns the `Ok` value of `result`.
 *
 * This function can be used for control flow based on result values.
 *
 * @param result - The Result to chain
 * @param fn - A function to call with the Err value that returns a new Result
 * @returns The original Ok result or the result of calling fn
 */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  return result.kind === "ok" ? result : fn(result.inner);
}
