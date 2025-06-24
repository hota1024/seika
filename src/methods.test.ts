import { describe, expect, it, vi } from "vitest";
import { err, ok } from "./helpers";
import {
	and,
	andThen,
	expectErr,
	expect as expectResult,
	inspect,
	inspectErr,
	isErr,
	isErrAnd,
	isOk,
	isOkAnd,
	map,
	mapErr,
	mapOr,
	mapOrElse,
	or,
	orElse,
	resultErr,
	resultOk,
	unwrap,
	unwrapErr,
	unwrapOr,
	unwrapOrElse,
} from "./methods";

describe("methods", () => {
	describe("ok", () => {
		it("should create a successful Result with value", () => {
			const result = ok("success");
			expect(result).toEqual({
				kind: "ok",
				inner: "success",
			});
		});

		it("should work with different data types", () => {
			const numberResult = ok(42);
			const objectResult = ok({ foo: "bar" });
			const arrayResult = ok([1, 2, 3]);

			expect(numberResult.kind).toBe("ok");
			expect(numberResult.inner).toBe(42);
			expect(objectResult.inner).toEqual({ foo: "bar" });
			expect(arrayResult.inner).toEqual([1, 2, 3]);
		});
	});

	describe("err", () => {
		it("should create an error Result with value", () => {
			const result = err("error message");
			expect(result).toEqual({
				kind: "err",
				inner: "error message",
			});
		});

		it("should work with different error types", () => {
			const stringError = err("string error");
			const numberError = err(404);
			const objectError = err({
				code: "E001",
				message: "Something went wrong",
			});

			expect(stringError.kind).toBe("err");
			expect(stringError.inner).toBe("string error");
			expect(numberError.inner).toBe(404);
			expect(objectError.inner).toEqual({
				code: "E001",
				message: "Something went wrong",
			});
		});
	});

	describe("isOk", () => {
		it("should return true for Ok results", () => {
			expect(isOk(ok("value"))).toBe(true);
		});

		it("should return false for Err results", () => {
			expect(isOk(err("error"))).toBe(false);
		});
	});

	describe("isOkAnd", () => {
		it("should return true if Ok and predicate matches", () => {
			expect(isOkAnd(ok(5), (x) => x > 3)).toBe(true);
		});

		it("should return false if Ok but predicate does not match", () => {
			expect(isOkAnd(ok(2), (x) => x > 3)).toBe(false);
		});

		it("should return false for Err results", () => {
			expect(isOkAnd(err("error"), () => true)).toBe(false);
		});
	});

	describe("isErr", () => {
		it("should return true for Err results", () => {
			expect(isErr(err("error"))).toBe(true);
		});

		it("should return false for Ok results", () => {
			expect(isErr(ok("value"))).toBe(false);
		});
	});

	describe("isErrAnd", () => {
		it("should return true if Err and predicate matches", () => {
			expect(isErrAnd(err(404), (x) => x >= 400)).toBe(true);
		});

		it("should return false if Err but predicate does not match", () => {
			expect(isErrAnd(err(200), (x) => x >= 400)).toBe(false);
		});

		it("should return false for Ok results", () => {
			expect(isErrAnd(ok("value"), () => true)).toBe(false);
		});
	});

	describe("resultOk", () => {
		it("should return value for Ok results", () => {
			expect(resultOk(ok("value"))).toBe("value");
		});

		it("should return undefined for Err results", () => {
			expect(resultOk(err("error"))).toBeUndefined();
		});
	});

	describe("resultErr", () => {
		it("should return error for Err results", () => {
			expect(resultErr(err("error"))).toBe("error");
		});

		it("should return undefined for Ok results", () => {
			expect(resultErr(ok("value"))).toBeUndefined();
		});
	});

	describe("map", () => {
		it("should transform Ok values", () => {
			const result = map(ok(5), (x) => x * 2);
			expect(result).toEqual(ok(10));
		});

		it("should leave Err values unchanged", () => {
			const result = map(err("error"), (x) => x * 2);
			expect(result).toEqual(err("error"));
		});
	});

	describe("mapOr", () => {
		it("should apply function to Ok values", () => {
			expect(mapOr(ok(5), 0, (x) => x * 2)).toBe(10);
		});

		it("should return default for Err values", () => {
			expect(mapOr(err("error"), 0, (x) => x * 2)).toBe(0);
		});
	});

	describe("mapOrElse", () => {
		it("should apply function to Ok values", () => {
			expect(
				mapOrElse(
					ok(5),
					() => 0,
					(x) => x * 2,
				),
			).toBe(10);
		});

		it("should apply fallback function to Err values", () => {
			expect(
				mapOrElse(
					err("error"),
					(e) => e.length,
					(x) => x * 2,
				),
			).toBe(5);
		});
	});

	describe("mapErr", () => {
		it("should transform Err values", () => {
			const result = mapErr(err("error"), (e) => e.toUpperCase());
			expect(result).toEqual(err("ERROR"));
		});

		it("should leave Ok values unchanged", () => {
			const result = mapErr(ok("value"), (e: string) => e.toUpperCase());
			expect(result).toEqual(ok("value"));
		});
	});

	describe("inspect", () => {
		it("should call function with Ok value", () => {
			const fn = vi.fn();
			const result = inspect(ok("value"), fn);
			expect(fn).toHaveBeenCalledWith("value");
			expect(result).toEqual(ok("value"));
		});

		it("should not call function for Err values", () => {
			const fn = vi.fn();
			const result = inspect(err("error"), fn);
			expect(fn).not.toHaveBeenCalled();
			expect(result).toEqual(err("error"));
		});
	});

	describe("inspectErr", () => {
		it("should call function with Err value", () => {
			const fn = vi.fn();
			const result = inspectErr(err("error"), fn);
			expect(fn).toHaveBeenCalledWith("error");
			expect(result).toEqual(err("error"));
		});

		it("should not call function for Ok values", () => {
			const fn = vi.fn();
			const result = inspectErr(ok("value"), fn);
			expect(fn).not.toHaveBeenCalled();
			expect(result).toEqual(ok("value"));
		});
	});

	describe("expect", () => {
		it("should return value for Ok results", () => {
			expect(expectResult(ok("value"), "message")).toBe("value");
		});

		it("should throw error with message for Err results", () => {
			expect(() => expectResult(err("error"), "custom message")).toThrow(
				"custom message",
			);
		});
	});

	describe("unwrap", () => {
		it("should extract value from successful Result", () => {
			const result = ok("unwrapped value");
			const value = unwrap(result);
			expect(value).toBe("unwrapped value");
		});

		it("should work with different data types", () => {
			const numberResult = ok(123);
			const objectResult = ok({ test: true });

			expect(unwrap(numberResult)).toBe(123);
			expect(unwrap(objectResult)).toEqual({ test: true });
		});

		it("should throw error for Err results", () => {
			expect(() => unwrap(err("error"))).toThrow(
				"Called unwrap on an Err value",
			);
		});
	});

	describe("unwrapOr", () => {
		it("should return value for Ok results", () => {
			expect(unwrapOr(ok("value"), "default")).toBe("value");
		});

		it("should return default for Err results", () => {
			expect(unwrapOr(err("error"), "default")).toBe("default");
		});
	});

	describe("unwrapOrElse", () => {
		it("should return value for Ok results", () => {
			expect(unwrapOrElse(ok("value"), () => "default")).toBe("value");
		});

		it("should call function for Err results", () => {
			expect(unwrapOrElse(err("error"), (e) => `fallback: ${e}`)).toBe(
				"fallback: error",
			);
		});
	});

	describe("expectErr", () => {
		it("should return error for Err results", () => {
			expect(expectErr(err("error"), "message")).toBe("error");
		});

		it("should throw error with message for Ok results", () => {
			expect(() => expectErr(ok("value"), "custom message")).toThrow(
				"custom message",
			);
		});
	});

	describe("unwrapErr", () => {
		it("should return error for Err results", () => {
			expect(unwrapErr(err("error"))).toBe("error");
		});

		it("should throw error for Ok results", () => {
			expect(() => unwrapErr(ok("value"))).toThrow(
				"Called unwrapErr on an Ok value",
			);
		});
	});

	describe("and", () => {
		it("should return second result if first is Ok", () => {
			expect(and(ok("first"), ok("second"))).toEqual(ok("second"));
			expect(and(ok("first"), err("error"))).toEqual(err("error"));
		});

		it("should return first result if it is Err", () => {
			expect(and(err("error"), ok("second"))).toEqual(err("error"));
			expect(and(err("error"), err("second"))).toEqual(err("error"));
		});
	});

	describe("andThen", () => {
		it("should apply function to Ok values", () => {
			const result = andThen(ok(5), (x) => ok(x * 2));
			expect(result).toEqual(ok(10));
		});

		it("should propagate function errors", () => {
			const result = andThen(ok(5), () => err("function error"));
			expect(result).toEqual(err("function error"));
		});

		it("should not call function for Err values", () => {
			const fn = vi.fn();
			const result = andThen(err("error"), fn);
			expect(fn).not.toHaveBeenCalled();
			expect(result).toEqual(err("error"));
		});
	});

	describe("or", () => {
		it("should return first result if it is Ok", () => {
			expect(or(ok("first"), ok("second"))).toEqual(ok("first"));
			expect(or(ok("first"), err("error"))).toEqual(ok("first"));
		});

		it("should return second result if first is Err", () => {
			expect(or(err("error"), ok("second"))).toEqual(ok("second"));
			expect(or(err("first"), err("second"))).toEqual(err("second"));
		});
	});

	describe("orElse", () => {
		it("should return Ok result unchanged", () => {
			const fn = vi.fn();
			const result = orElse(ok("value"), fn);
			expect(fn).not.toHaveBeenCalled();
			expect(result).toEqual(ok("value"));
		});

		it("should apply function to Err values", () => {
			const result = orElse(err("error"), (e) => ok(`recovered: ${e}`));
			expect(result).toEqual(ok("recovered: error"));
		});

		it("should propagate function errors", () => {
			const result = orElse(err("error"), () => err("new error"));
			expect(result).toEqual(err("new error"));
		});
	});
});
