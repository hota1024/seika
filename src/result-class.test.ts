import { describe, expect, it, vi } from "vitest";
import { err, ok } from "./helpers";
import { Err, Ok, Res } from "./result-class";

describe("result-class", () => {
	describe("Res static factory methods", () => {
		describe("Res.ok", () => {
			it("should create an Ok instance", () => {
				const result = Res.ok("success");
				expect(result).toBeInstanceOf(Ok);
				expect(result.isOk()).toBe(true);
				expect(result.isErr()).toBe(false);
				expect(result.value).toBe("success");
			});

			it("should work with different data types", () => {
				const numberResult = Res.ok(42);
				const objectResult = Res.ok({ foo: "bar" });
				const arrayResult = Res.ok([1, 2, 3]);

				expect(numberResult.value).toBe(42);
				expect(objectResult.value).toEqual({ foo: "bar" });
				expect(arrayResult.value).toEqual([1, 2, 3]);
			});
		});

		describe("Res.err", () => {
			it("should create an Err instance", () => {
				const result = Res.err("error message");
				expect(result).toBeInstanceOf(Err);
				expect(result.isOk()).toBe(false);
				expect(result.isErr()).toBe(true);
				expect(result.error).toBe("error message");
			});

			it("should work with different error types", () => {
				const stringError = Res.err("string error");
				const numberError = Res.err(404);
				const objectError = Res.err({
					code: "E001",
					message: "Something went wrong",
				});

				expect(stringError.error).toBe("string error");
				expect(numberError.error).toBe(404);
				expect(objectError.error).toEqual({
					code: "E001",
					message: "Something went wrong",
				});
			});
		});

		describe("Res.from", () => {
			it("should convert functional Ok result to class-based Ok", () => {
				const functionalResult = ok("success");
				const classResult = Res.from(functionalResult);

				expect(classResult).toBeInstanceOf(Ok);
				expect(classResult.isOk()).toBe(true);
				expect(classResult.isErr()).toBe(false);
				expect(classResult.value).toBe("success");
			});

			it("should convert functional Err result to class-based Err", () => {
				const functionalResult = err("error message");
				const classResult = Res.from(functionalResult);

				expect(classResult).toBeInstanceOf(Err);
				expect(classResult.isOk()).toBe(false);
				expect(classResult.isErr()).toBe(true);
				expect(classResult.error).toBe("error message");
			});

			it("should work with different data types for Ok", () => {
				const numberResult = ok(42);
				const objectResult = ok({ foo: "bar" });
				const arrayResult = ok([1, 2, 3]);

				const numberClass = Res.from(numberResult);
				const objectClass = Res.from(objectResult);
				const arrayClass = Res.from(arrayResult);

				expect(numberClass.value).toBe(42);
				expect(objectClass.value).toEqual({ foo: "bar" });
				expect(arrayClass.value).toEqual([1, 2, 3]);
			});

			it("should work with different error types for Err", () => {
				const stringError = err("string error");
				const numberError = err(404);
				const objectError = err({
					code: "E001",
					message: "Something went wrong",
				});

				const stringClass = Res.from(stringError);
				const numberClass = Res.from(numberError);
				const objectClass = Res.from(objectError);

				expect(stringClass.error).toBe("string error");
				expect(numberClass.error).toBe(404);
				expect(objectClass.error).toEqual({
					code: "E001",
					message: "Something went wrong",
				});
			});

			it("should preserve type information", () => {
				const okResult = ok("value");
				const errResult = err("error");

				const okClass = Res.from(okResult);
				const errClass = Res.from(errResult);

				// These should not throw type errors
				expect(okClass.ok()).toBe("value");
				expect(errClass.err()).toBe("error");
			});

			it("should work with chain operations after conversion", () => {
				const functionalResult = ok(5);
				const classResult = Res.from(functionalResult);

				// Verify that the converted result works with basic operations
				expect(classResult.isOk()).toBe(true);
				if (classResult.isOk()) {
					const doubled = classResult.map((x) => (x as number) * 2);
					expect(doubled.unwrap()).toBe(10);
				}
			});
		});
	});

	describe("Ok class", () => {
		it("should have correct toString representation", () => {
			expect(Res.ok("value").toString()).toBe("Ok(value)");
			expect(Res.ok(42).toString()).toBe("Ok(42)");
		});

		it("should have correct JSON representation", () => {
			expect((Res.ok("value") as Ok<string, never>).toJSON()).toEqual({
				kind: "ok",
				value: "value",
			});
			expect((Res.ok(42) as Ok<number, never>).toJSON()).toEqual({
				kind: "ok",
				value: 42,
			});
		});
	});

	describe("Err class", () => {
		it("should have correct toString representation", () => {
			expect(Res.err("error").toString()).toBe("Err(error)");
			expect(Res.err(404).toString()).toBe("Err(404)");
		});

		it("should have correct JSON representation", () => {
			expect((Res.err("error") as Err<never, string>).toJSON()).toEqual({
				kind: "err",
				error: "error",
			});
			expect((Res.err(404) as Err<never, number>).toJSON()).toEqual({
				kind: "err",
				error: 404,
			});
		});
	});

	describe("Type guard methods", () => {
		describe("isOkAnd", () => {
			it("should return true if Ok and predicate matches", () => {
				expect(Res.ok(5).isOkAnd((x) => x > 3)).toBe(true);
			});

			it("should return false if Ok but predicate does not match", () => {
				expect(Res.ok(2).isOkAnd((x) => x > 3)).toBe(false);
			});

			it("should return false for Err results", () => {
				expect(Res.err("error").isOkAnd(() => true)).toBe(false);
			});
		});

		describe("isErrAnd", () => {
			it("should return true if Err and predicate matches", () => {
				expect(Res.err(404).isErrAnd((x) => x >= 400)).toBe(true);
			});

			it("should return false if Err but predicate does not match", () => {
				expect(Res.err(200).isErrAnd((x) => x >= 400)).toBe(false);
			});

			it("should return false for Ok results", () => {
				expect(Res.ok("value").isErrAnd(() => true)).toBe(false);
			});
		});
	});

	describe("Value extraction methods", () => {
		describe("ok", () => {
			it("should return value for Ok results", () => {
				expect(Res.ok("value").ok()).toBe("value");
			});

			it("should return undefined for Err results", () => {
				expect(Res.err("error").ok()).toBeUndefined();
			});
		});

		describe("err", () => {
			it("should return error for Err results", () => {
				expect(Res.err("error").err()).toBe("error");
			});

			it("should return undefined for Ok results", () => {
				expect(Res.ok("value").err()).toBeUndefined();
			});
		});

		describe("unwrap", () => {
			it("should return value for Ok results", () => {
				expect(Res.ok("value").unwrap()).toBe("value");
			});

			it("should throw error for Err results", () => {
				expect(() => Res.err("error").unwrap()).toThrow(
					"Called unwrap on an Err value",
				);
			});
		});

		describe("unwrapOr", () => {
			it("should return value for Ok results", () => {
				expect(Res.ok("value").unwrapOr("default")).toBe("value");
			});

			it("should return default for Err results", () => {
				const result: Res<string, string> = Res.err("error");
				expect(result.unwrapOr("default")).toBe("default");
			});
		});

		describe("unwrapOrElse", () => {
			it("should return value for Ok results", () => {
				expect(Res.ok("value").unwrapOrElse(() => "default")).toBe("value");
			});

			it("should call function for Err results", () => {
				const result: Res<string, string> = Res.err("error");
				expect(result.unwrapOrElse((e) => `fallback: ${e}`)).toBe(
					"fallback: error",
				);
			});
		});

		describe("expect", () => {
			it("should return value for Ok results", () => {
				expect(Res.ok("value").expect("message")).toBe("value");
			});

			it("should throw error with message for Err results", () => {
				expect(() => Res.err("error").expect("custom message")).toThrow(
					"custom message",
				);
			});
		});

		describe("expectErr", () => {
			it("should return error for Err results", () => {
				expect(Res.err("error").expectErr("message")).toBe("error");
			});

			it("should throw error with message for Ok results", () => {
				expect(() => Res.ok("value").expectErr("custom message")).toThrow(
					"custom message",
				);
			});
		});

		describe("unwrapErr", () => {
			it("should return error for Err results", () => {
				expect(Res.err("error").unwrapErr()).toBe("error");
			});

			it("should throw error for Ok results", () => {
				expect(() => Res.ok("value").unwrapErr()).toThrow(
					"Called unwrapErr on an Ok value",
				);
			});
		});
	});

	describe("Transformation methods", () => {
		describe("map", () => {
			it("should transform Ok values", () => {
				const result = Res.ok(5).map((x) => x * 2);
				expect(result.isOk()).toBe(true);
				expect(result.unwrap()).toBe(10);
			});

			it("should leave Err values unchanged", () => {
				const result = Res.err("error").map((x) => x * 2);
				expect(result.isErr()).toBe(true);
				expect(result.unwrapErr()).toBe("error");
			});
		});

		describe("mapOr", () => {
			it("should apply function to Ok values", () => {
				expect(Res.ok(5).mapOr(0, (x) => x * 2)).toBe(10);
			});

			it("should return default for Err values", () => {
				expect(Res.err("error").mapOr(0, (x) => x * 2)).toBe(0);
			});
		});

		describe("mapOrElse", () => {
			it("should apply function to Ok values", () => {
				expect(
					Res.ok(5).mapOrElse(
						() => 0,
						(x) => x * 2,
					),
				).toBe(10);
			});

			it("should apply fallback function to Err values", () => {
				expect(
					Res.err("error").mapOrElse(
						(e) => e.length,
						(x) => x * 2,
					),
				).toBe(5);
			});
		});

		describe("mapErr", () => {
			it("should transform Err values", () => {
				const result = Res.err("error").mapErr((e) => e.toUpperCase());
				expect(result.isErr()).toBe(true);
				expect(result.unwrapErr()).toBe("ERROR");
			});

			it("should leave Ok values unchanged", () => {
				const result = Res.ok("value").mapErr((e: string) => e.toUpperCase());
				expect(result.isOk()).toBe(true);
				expect(result.unwrap()).toBe("value");
			});
		});
	});

	describe("Side effect methods", () => {
		describe("inspect", () => {
			it("should call function with Ok value", () => {
				const fn = vi.fn();
				const result = Res.ok("value").inspect(fn);
				expect(fn).toHaveBeenCalledWith("value");
				expect(result.unwrap()).toBe("value");
			});

			it("should not call function for Err values", () => {
				const fn = vi.fn();
				const result = Res.err("error").inspect(fn);
				expect(fn).not.toHaveBeenCalled();
				expect(result.unwrapErr()).toBe("error");
			});

			it("should return the same instance for method chaining", () => {
				const original = Res.ok("value");
				const result = original.inspect(() => {});
				expect(result).toBe(original);
			});
		});

		describe("inspectErr", () => {
			it("should call function with Err value", () => {
				const fn = vi.fn();
				const result = Res.err("error").inspectErr(fn);
				expect(fn).toHaveBeenCalledWith("error");
				expect(result.unwrapErr()).toBe("error");
			});

			it("should not call function for Ok values", () => {
				const fn = vi.fn();
				const result = Res.ok("value").inspectErr(fn);
				expect(fn).not.toHaveBeenCalled();
				expect(result.unwrap()).toBe("value");
			});

			it("should return the same instance for method chaining", () => {
				const original = Res.err("error");
				const result = original.inspectErr(() => {});
				expect(result).toBe(original);
			});
		});
	});

	describe("Combinator methods", () => {
		describe("and", () => {
			it("should return second result if first is Ok", () => {
				const result1 = Res.ok("first").and(Res.ok("second"));
				expect(result1.isOk()).toBe(true);
				expect(result1.unwrap()).toBe("second");

				const result2 = Res.ok("first").and(Res.err("error") as any);
				expect(result2.isErr()).toBe(true);
				expect(result2.unwrapErr()).toBe("error");
			});

			it("should return first result if it is Err", () => {
				const result1 = Res.err("error").and(Res.ok("second"));
				expect(result1.isErr()).toBe(true);
				expect(result1.unwrapErr()).toBe("error");

				const result2 = Res.err("error").and(Res.err("second"));
				expect(result2.isErr()).toBe(true);
				expect(result2.unwrapErr()).toBe("error");
			});
		});

		describe("andThen", () => {
			it("should apply function to Ok values", () => {
				const result = Res.ok(5).andThen((x) => Res.ok(x * 2));
				expect(result.isOk()).toBe(true);
				expect(result.unwrap()).toBe(10);
			});

			it("should propagate function errors", () => {
				const result = Res.ok(5).andThen(
					() => Res.err("function error") as any,
				);
				expect(result.isErr()).toBe(true);
				expect(result.unwrapErr()).toBe("function error");
			});

			it("should not call function for Err values", () => {
				const fn = vi.fn();
				const result = Res.err("error").andThen(fn);
				expect(fn).not.toHaveBeenCalled();
				expect(result.isErr()).toBe(true);
				expect(result.unwrapErr()).toBe("error");
			});
		});

		describe("or", () => {
			it("should return first result if it is Ok", () => {
				const result1 = Res.ok("first").or(Res.ok("second"));
				expect(result1.isOk()).toBe(true);
				expect(result1.unwrap()).toBe("first");

				const result2 = Res.ok("first").or(Res.err("error"));
				expect(result2.isOk()).toBe(true);
				expect(result2.unwrap()).toBe("first");
			});

			it("should return second result if first is Err", () => {
				const result1 = Res.err("error").or(Res.ok("second") as any);
				expect(result1.isOk()).toBe(true);
				expect(result1.unwrap()).toBe("second");

				const result2 = Res.err("first").or(Res.err("second"));
				expect(result2.isErr()).toBe(true);
				expect(result2.unwrapErr()).toBe("second");
			});
		});

		describe("orElse", () => {
			it("should return Ok result unchanged", () => {
				const fn = vi.fn();
				const result = Res.ok("value").orElse(fn);
				expect(fn).not.toHaveBeenCalled();
				expect(result.isOk()).toBe(true);
				expect(result.unwrap()).toBe("value");
			});

			it("should apply function to Err values", () => {
				const result = Res.err("error").orElse(
					(e) => Res.ok(`recovered: ${e}`) as any,
				);
				expect(result.isOk()).toBe(true);
				expect(result.unwrap()).toBe("recovered: error");
			});

			it("should propagate function errors", () => {
				const result = Res.err("error").orElse(() => Res.err("new error"));
				expect(result.isErr()).toBe(true);
				expect(result.unwrapErr()).toBe("new error");
			});
		});
	});

	describe("Method chaining", () => {
		it("should support fluent API", () => {
			const result = Res.ok(5)
				.map((x) => x * 2)
				.inspect((x) => console.log(x))
				.andThen((x) => Res.ok(x + 1))
				.mapOr(0, (x) => x);

			expect(result).toBe(11);
		});

		it("should short-circuit on errors", () => {
			const result = Res.err("initial error")
				.map((x: any) => x * 2)
				.inspect((x) => console.log(x))
				.andThen((x) => Res.ok(x + 1))
				.unwrapOr("default" as any);

			expect(result).toBe("default");
		});
	});
});
