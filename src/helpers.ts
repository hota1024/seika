import type { Result } from "./result-type";

export function ok<T>(value: T): Result<T, never> {
	return { kind: "ok", inner: value };
}

export function err<E>(value: E): Result<never, E> {
	return { kind: "err", inner: value };
}
