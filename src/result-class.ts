import type { Result } from "./result-type";

export abstract class Res<T, E> {
	abstract isOk(): this is Ok<T, E>;
	abstract isErr(): this is Err<T, E>;
	abstract readonly value: T;
	abstract readonly error: E;

	/**
	 * Returns `true` if the result is `Ok` and the value inside matches a predicate.
	 *
	 * @param predicate - A function that tests the Ok value
	 * @returns `true` if the result is `Ok` and the predicate returns `true`
	 */
	isOkAnd(predicate: (value: T) => boolean): boolean {
		return this.isOk() && predicate(this.value);
	}

	/**
	 * Returns `true` if the result is `Err` and the error inside matches a predicate.
	 *
	 * @param predicate - A function that tests the Err value
	 * @returns `true` if the result is `Err` and the predicate returns `true`
	 */
	isErrAnd(predicate: (error: E) => boolean): boolean {
		return this.isErr() && predicate(this.error);
	}

	/**
	 * Converts from `Result<T, E>` to `T | undefined`.
	 * Returns the Ok value if present, otherwise `undefined`.
	 *
	 * @returns The Ok value or `undefined`
	 */
	ok(): T | undefined {
		return this.isOk() ? this.value : undefined;
	}

	/**
	 * Converts from `Result<T, E>` to `E | undefined`.
	 * Returns the Err value if present, otherwise `undefined`.
	 *
	 * @returns The Err value or `undefined`
	 */
	err(): E | undefined {
		return this.isErr() ? this.error : undefined;
	}

	/**
	 * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained `Ok` value,
	 * leaving an `Err` value untouched.
	 *
	 * This function can be used to compose the results of two functions.
	 *
	 * @param fn - A function to apply to the Ok value
	 * @returns A new Result with the transformed Ok value or the original Err
	 */
	map<U>(fn: (value: T) => U): Res<U, E> {
		return this.isOk() ? new Ok(fn(this.value)) : new Err(this.error);
	}

	/**
	 * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
	 *
	 * Arguments passed to `mapOr` are eagerly evaluated; if you are passing the result of a function call,
	 * it is recommended to use `mapOrElse`, which is lazily evaluated.
	 *
	 * @param defaultValue - The default value to return if the result is Err
	 * @param fn - A function to apply to the Ok value
	 * @returns The result of applying fn to the Ok value or the default value
	 */
	mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
		return this.isOk() ? fn(this.value) : defaultValue;
	}

	/**
	 * Maps a `Result<T, E>` to `U` by applying fallback function `fallback` to a contained `Err` value,
	 * or function `fn` to a contained `Ok` value.
	 *
	 * This function can be used to unpack a successful result while handling an error.
	 *
	 * @param fallback - A function to apply to the Err value
	 * @param fn - A function to apply to the Ok value
	 * @returns The result of applying the appropriate function
	 */
	mapOrElse<U>(fallback: (error: E) => U, fn: (value: T) => U): U {
		return this.isOk() ? fn(this.value) : fallback(this.error);
	}

	/**
	 * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained `Err` value,
	 * leaving an `Ok` value untouched.
	 *
	 * This function can be used to pass through a successful result while handling an error.
	 *
	 * @param fn - A function to apply to the Err value
	 * @returns A new Result with the transformed Err value or the original Ok
	 */
	mapErr<F>(fn: (error: E) => F): Res<T, F> {
		return this.isErr() ? new Err(fn(this.error)) : new Ok(this.value);
	}

	/**
	 * Calls the provided closure with the contained value (if `Ok`).
	 *
	 * @param fn - A function to call with the Ok value
	 * @returns The original result unchanged
	 */
	inspect(fn: (value: T) => void): Res<T, E> {
		if (this.isOk()) {
			fn(this.value);
		}
		return this;
	}

	/**
	 * Calls the provided closure with the contained error (if `Err`).
	 *
	 * @param fn - A function to call with the Err value
	 * @returns The original result unchanged
	 */
	inspectErr(fn: (error: E) => void): Res<T, E> {
		if (this.isErr()) {
			fn(this.error);
		}
		return this;
	}

	/**
	 * Returns the contained `Ok` value.
	 *
	 * @param message - The error message to throw if the result is Err
	 * @returns The Ok value
	 * @throws Error with the provided message if the result is Err
	 */
	expect(message: string): T {
		if (this.isOk()) {
			return this.value;
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
	 * @returns The Ok value
	 * @throws Error if the result is Err
	 */
	unwrap(): T {
		if (this.isOk()) {
			return this.value;
		}
		throw new Error("Called unwrap on an Err value");
	}

	/**
	 * Returns the contained `Ok` value or a provided default.
	 *
	 * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing the result of a function call,
	 * it is recommended to use `unwrapOrElse`, which is lazily evaluated.
	 *
	 * @param defaultValue - The default value to return if the result is Err
	 * @returns The Ok value or the default value
	 */
	unwrapOr(defaultValue: T): T {
		return this.isOk() ? this.value : defaultValue;
	}

	/**
	 * Returns the contained `Ok` value or computes it from a closure.
	 *
	 * @param fn - A function to compute the default value from the Err value
	 * @returns The Ok value or the result of calling fn with the Err value
	 */
	unwrapOrElse(fn: (error: E) => T): T {
		return this.isOk() ? this.value : fn(this.error);
	}

	/**
	 * Returns the contained `Err` value.
	 *
	 * @param message - The error message to throw if the result is Ok
	 * @returns The Err value
	 * @throws Error with the provided message if the result is Ok
	 */
	expectErr(message: string): E {
		if (this.isErr()) {
			return this.error;
		}
		throw new Error(message);
	}

	/**
	 * Returns the contained `Err` value.
	 *
	 * @returns The Err value
	 * @throws Error if the result is Ok
	 */
	unwrapErr(): E {
		if (this.isErr()) {
			return this.error;
		}
		throw new Error("Called unwrapErr on an Ok value");
	}

	/**
	 * Returns `other` if the result is `Ok`, otherwise returns the `Err` value of `result`.
	 *
	 * @param other - The second Result to return if the first is Ok
	 * @returns The second result if the first is Ok, otherwise the first result
	 */
	and<U>(other: Res<U, E>): Res<U, E> {
		return this.isOk() ? other : new Err(this.error);
	}

	/**
	 * Calls `fn` if the result is `Ok`, otherwise returns the `Err` value of `result`.
	 *
	 * This function can be used for control flow based on `Result` values.
	 *
	 * @param fn - A function to call with the Ok value that returns a new Result
	 * @returns The result of calling fn or the original Err
	 */
	andThen<U>(fn: (value: T) => Res<U, E>): Res<U, E> {
		return this.isOk() ? fn(this.value) : new Err(this.error);
	}

	/**
	 * Returns the result if it contains a value, otherwise returns `other`.
	 *
	 * @param other - The second Result to return if the first is Err
	 * @returns The first result if it's Ok, otherwise the second result
	 */
	or<F>(other: Res<T, F>): Res<T, F> {
		return this.isOk() ? new Ok(this.value) : other;
	}

	/**
	 * Calls `fn` if the result is `Err`, otherwise returns the `Ok` value of `result`.
	 *
	 * This function can be used for control flow based on result values.
	 *
	 * @param fn - A function to call with the Err value that returns a new Result
	 * @returns The original Ok result or the result of calling fn
	 */
	orElse<F>(fn: (error: E) => Res<T, F>): Res<T, F> {
		return this.isOk() ? new Ok(this.value) : fn(this.error);
	}

	/**
	 * Creates a `Result` containing an `Ok` value.
	 *
	 * @param value - The value to wrap in Ok
	 * @returns A Result containing the Ok value
	 */
	static ok<T, E = never>(value: T): Res<T, E> {
		return new Ok(value);
	}

	/**
	 * Creates a `Result` containing an `Err` value.
	 *
	 * @param error - The error to wrap in Err
	 * @returns A Result containing the Err value
	 */
	static err<T = never, E = unknown>(error: E): Res<T, E> {
		return new Err(error);
	}

	/**
	 * Converts a functional `Result<T, E>` to a class-based `Res<T, E>`.
	 *
	 * @param result - The Result to convert
	 * @returns A class-based Result equivalent
	 */
	static from<T, E, R extends Result<T, E>>(result: R): Res<T, E> {
		return result.kind === "ok" ? Res.ok(result.inner) : Res.err(result.inner);
	}
}

export class Ok<T, E> extends Res<T, E> {
	public readonly error!: E;

	constructor(public readonly value: T) {
		super();
	}

	isOk(): this is Ok<T, E> {
		return true;
	}

	isErr(): this is Err<T, E> {
		return false;
	}

	toString(): string {
		return `Ok(${this.value})`;
	}

	toJSON(): { kind: "ok"; value: T } {
		return { kind: "ok", value: this.value };
	}
}

export class Err<T, E> extends Res<T, E> {
	public readonly value!: T;

	constructor(public readonly error: E) {
		super();
	}

	isOk(): this is Ok<T, E> {
		return false;
	}

	isErr(): this is Err<T, E> {
		return true;
	}

	toString(): string {
		return `Err(${this.error})`;
	}

	toJSON(): { kind: "err"; error: E } {
		return { kind: "err", error: this.error };
	}
}
