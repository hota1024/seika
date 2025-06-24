# seika

seika provides `Result<T, E>` composed of plain object.

Inspired by [Rust's `Result<T, E>`](https://doc.rust-lang.org/std/result/enum.Result.html) type, this library brings robust error handling to TypeScript with both functional and object-oriented approaches.

## Installation

```bash
npm install seika
```

```bash
yarn add seika
```

```bash
pnpm add seika
```

# Example

## Basic Usage

```ts
import { type Result, ok, err, unwrap, map, unwrapOr } from "seika";

// Creating Results
const success: Result<number, string> = ok(42);
const failure: Result<number, string> = err("Something went wrong");

// Extracting values safely
const value1 = unwrapOr(success, 0); // 42
const value2 = unwrapOr(failure, 0); // 0

// Transforming success values
const doubled = map(success, (x) => x * 2); // ok(84)
const stillError = map(failure, (x) => x * 2); // err("Something went wrong")
```

## Error Handling Pattern

```ts
import { type Result, ok, err, andThen, mapErr, unwrapOr } from "seika";

type User = { id: number; name: string };
type DatabaseError = { code: string; message: string };

function findUser(id: number): Result<User, DatabaseError> {
  if (id === 1) {
    return ok({ id: 1, name: "Alice" });
  }
  return err({ code: "NOT_FOUND", message: "User not found" });
}

function validateUser(user: User): Result<User, DatabaseError> {
  if (user.name.length > 0) {
    return ok(user);
  }
  return err({ code: "INVALID", message: "User name cannot be empty" });
}

// Chain operations with automatic error propagation
const result = andThen(findUser(1), validateUser);

// Handle the result
const mappedResult = mapErr(
  result,
  (error) => `Error ${error.code}: ${error.message}`
);
const userName = unwrapOr(mappedResult, "Unknown user");

console.log(userName); // "Alice" if successful, error message if failed
```

## API Response Processing

```ts
import {
  type Result,
  ok,
  err,
  map,
  andThen,
  mapErr,
  unwrapOrElse,
  inspect,
  inspectErr,
} from "seika";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

function parseApiResponse<T>(response: ApiResponse<T>): Result<T, string> {
  if (response.status >= 200 && response.status < 300 && response.data) {
    return ok(response.data);
  }
  return err(response.error || `HTTP ${response.status}`);
}

function processUserData(userData: any): Result<User, string> {
  if (typeof userData.id === "number" && typeof userData.name === "string") {
    return ok({ id: userData.id, name: userData.name });
  }
  return err("Invalid user data format");
}

// Simulate API calls
const apiResponse: ApiResponse<any> = {
  data: { id: 1, name: "Bob" },
  status: 200,
};

let result = parseApiResponse(apiResponse);
result = inspect(result, (data) => console.log("Raw data:", data));
result = andThen(result, processUserData);
result = inspectErr(result, (error) =>
  console.error("Processing failed:", error)
);
result = map(result, (user) => ({ ...user, name: user.name.toUpperCase() }));

const finalUser = unwrapOrElse(result, (error) => ({
  id: -1,
  name: "UNKNOWN",
}));
console.log(finalUser); // { id: 1, name: "BOB" }
```

## Configuration Validation

```ts
import { type Result, ok, err, and, map, mapOr, isOk, orElse } from "seika";

interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

function validateUrl(url: string): Result<string, string> {
  try {
    new URL(url);
    return ok(url);
  } catch {
    return err("Invalid URL format");
  }
}

function validateTimeout(timeout: number): Result<number, string> {
  if (timeout > 0 && timeout <= 30000) {
    return ok(timeout);
  }
  return err("Timeout must be between 1 and 30000ms");
}

function validateRetries(retries: number): Result<number, string> {
  if (retries >= 0 && retries <= 10) {
    return ok(retries);
  }
  return err("Retries must be between 0 and 10");
}

function validateConfig(config: Partial<Config>): Result<Config, string[]> {
  const urlResult = validateUrl(config.apiUrl || "");
  const timeoutResult = validateTimeout(config.timeout || 0);
  const retriesResult = validateRetries(config.retries || 0);

  // Collect all validation errors
  const errors: string[] = [];
  if (!isOk(urlResult)) errors.push(unwrapErr(urlResult));
  if (!isOk(timeoutResult)) errors.push(unwrapErr(timeoutResult));
  if (!isOk(retriesResult)) errors.push(unwrapErr(retriesResult));

  if (errors.length > 0) {
    return err(errors);
  }

  return ok({
    apiUrl: unwrap(urlResult),
    timeout: unwrap(timeoutResult),
    retries: unwrap(retriesResult),
  });
}

// Usage with fallback values
const userConfig = { apiUrl: "https://api.example.com", timeout: 5000 };
const configResult = validateConfig(userConfig);

const finalConfig = orElse(configResult, (errors) => {
  console.warn("Config validation failed:", errors);
  return ok({
    apiUrl: "https://default.api.com",
    timeout: 3000,
    retries: 3,
  });
});

console.log(unwrap(finalConfig)); // Valid config or fallback
```

## File Processing Pipeline

```ts
import {
  type Result,
  ok,
  err,
  andThen,
  map,
  mapErr,
  or,
  unwrapOr,
} from "seika";

interface FileData {
  name: string;
  content: string;
  size: number;
}

function readFile(path: string): Result<string, string> {
  // Simulate file reading
  if (path.endsWith(".txt")) {
    return ok("File content here...");
  }
  return err(`Cannot read file: ${path}`);
}

function parseContent(content: string): Result<any, string> {
  try {
    return ok(JSON.parse(content));
  } catch {
    return err("Invalid JSON content");
  }
}

function validateSchema(data: any): Result<FileData, string> {
  if (data.name && data.content && typeof data.size === "number") {
    return ok(data as FileData);
  }
  return err("Invalid file data schema");
}

function processFile(path: string): Result<FileData, string> {
  let result = readFile(path);
  result = andThen(result, parseContent);
  result = andThen(result, validateSchema);
  result = map(result, (file) => ({ ...file, name: file.name.toLowerCase() }));
  return result;
}

// Process multiple files with fallback
const files = ["data.txt", "config.json", "invalid.exe"];
const results = files.map(processFile);

const successfulFiles = results
  .map((result) => or(result, ok(null)))
  .map((result) => unwrapOr(result, null))
  .filter((file) => file !== null);

console.log(`Processed ${successfulFiles.length} files successfully`);
```

## Class-based API

seika also provides a class-based API for those who prefer object-oriented programming:

```ts
import { Res } from "seika/class";

// Using static factory methods
const success = Res.ok(42);
const failure = Res.err("Something went wrong");

// Method chaining with fluent API
const result = Res.ok(5)
  .map((x) => x * 2)
  .inspect((x) => console.log("Value:", x))
  .andThen((x) => Res.ok(x + 1))
  .unwrapOr(0);

console.log(result); // 11

// Converting from functional to class-based API
import { ok, err } from "seika";
const functionalResult = ok(42);
const classResult = Res.from(functionalResult); // Converts Result<T, E> to Res<T, E>

// Error handling with method chaining
const processResult = Res.ok("input")
  .map((input) => input.toUpperCase())
  .andThen((input) => {
    if (input.length > 10) {
      return Res.err("Input too long");
    }
    return Res.ok(input);
  })
  .orElse((error) => {
    console.warn("Processing failed:", error);
    return Res.ok("DEFAULT");
  });

console.log(processResult.unwrap()); // "INPUT" or "DEFAULT"
```

# Methods

## Constructor Functions

### `ok<T>(value: T): Result<T, never>`

Creates a successful Result containing the given value.

```ts
const result = ok(42);
// result: { kind: "ok", inner: 42 }
```

### `err<E>(error: E): Result<never, E>`

Creates an error Result containing the given error value.

```ts
const result = err("Something went wrong");
// result: { kind: "err", inner: "Something went wrong" }
```

## Type Guards

### `isOk<T, E>(result: Result<T, E>): boolean`

Returns `true` if the result is `Ok`, `false` otherwise.

```ts
isOk(ok(42)); // true
isOk(err("error")); // false
```

### `isOkAnd<T, E>(result: Result<T, E>, predicate: (value: T) => boolean): boolean`

Returns `true` if the result is `Ok` and the predicate returns `true` for the contained value.

```ts
isOkAnd(ok(5), (x) => x > 3); // true
isOkAnd(ok(2), (x) => x > 3); // false
isOkAnd(err("error"), (x) => x > 3); // false
```

### `isErr<T, E>(result: Result<T, E>): boolean`

Returns `true` if the result is `Err`, `false` otherwise.

```ts
isErr(ok(42)); // false
isErr(err("error")); // true
```

### `isErrAnd<T, E>(result: Result<T, E>, predicate: (error: E) => boolean): boolean`

Returns `true` if the result is `Err` and the predicate returns `true` for the contained error.

```ts
isErrAnd(err(404), (x) => x >= 400); // true
isErrAnd(err(200), (x) => x >= 400); // false
isErrAnd(ok("value"), (x) => x >= 400); // false
```

## Value Extraction

### `resultOk<T, E>(result: Result<T, E>): T | undefined`

Returns the contained value if `Ok`, otherwise returns `undefined`.

```ts
resultOk(ok("value")); // "value"
resultOk(err("error")); // undefined
```

### `resultErr<T, E>(result: Result<T, E>): E | undefined`

Returns the contained error if `Err`, otherwise returns `undefined`.

```ts
resultErr(ok("value")); // undefined
resultErr(err("error")); // "error"
```

### `unwrap<T, E>(result: Result<T, E>): T`

Returns the contained value if `Ok`, otherwise throws an error.

```ts
unwrap(ok(42)); // 42
unwrap(err("error")); // throws Error("Called unwrap on an Err value")
```

### `unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T`

Returns the contained value if `Ok`, otherwise returns the default value.

```ts
unwrapOr(ok("value"), "default"); // "value"
unwrapOr(err("error"), "default"); // "default"
```

### `unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T`

Returns the contained value if `Ok`, otherwise calls the function with the error and returns its result.

```ts
unwrapOrElse(ok("value"), () => "default"); // "value"
unwrapOrElse(err("error"), (e) => `fallback: ${e}`); // "fallback: error"
```

### `expect<T, E>(result: Result<T, E>, message: string): T`

Returns the contained value if `Ok`, otherwise throws an error with the given message.

```ts
expect(ok("value"), "Expected a value"); // "value"
expect(err("error"), "Expected a value"); // throws Error("Expected a value")
```

### `expectErr<T, E>(result: Result<T, E>, message: string): E`

Returns the contained error if `Err`, otherwise throws an error with the given message.

```ts
expectErr(err("error"), "Expected an error"); // "error"
expectErr(ok("value"), "Expected an error"); // throws Error("Expected an error")
```

### `unwrapErr<T, E>(result: Result<T, E>): E`

Returns the contained error if `Err`, otherwise throws an error.

```ts
unwrapErr(err("error")); // "error"
unwrapErr(ok("value")); // throws Error("Called unwrapErr on an Ok value")
```

## Transformations

### `map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>`

Transforms the contained value if `Ok` using the given function, otherwise returns the error unchanged.

```ts
map(ok(5), (x) => x * 2); // ok(10)
map(err("error"), (x) => x * 2); // err("error")
```

### `mapOr<T, E, U>(result: Result<T, E>, defaultValue: U, fn: (value: T) => U): U`

Applies the function to the contained value if `Ok`, otherwise returns the default value.

```ts
mapOr(ok(5), 0, (x) => x * 2); // 10
mapOr(err("error"), 0, (x) => x * 2); // 0
```

### `mapOrElse<T, E, U>(result: Result<T, E>, fallback: (error: E) => U, fn: (value: T) => U): U`

Applies the function to the contained value if `Ok`, otherwise applies the fallback function to the error.

```ts
mapOrElse(
  ok(5),
  () => 0,
  (x) => x * 2
); // 10
mapOrElse(
  err("error"),
  (e) => e.length,
  (x) => x * 2
); // 5
```

### `mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>`

Transforms the contained error if `Err` using the given function, otherwise returns the value unchanged.

```ts
mapErr(err("error"), (e) => e.toUpperCase()); // err("ERROR")
mapErr(ok("value"), (e) => e.toUpperCase()); // ok("value")
```

## Side Effects

### `inspect<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E>`

Calls the function with the contained value if `Ok`, then returns the result unchanged.

```ts
inspect(ok("value"), console.log); // logs "value", returns ok("value")
inspect(err("error"), console.log); // does nothing, returns err("error")
```

### `inspectErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E>`

Calls the function with the contained error if `Err`, then returns the result unchanged.

```ts
inspectErr(ok("value"), console.log); // does nothing, returns ok("value")
inspectErr(err("error"), console.log); // logs "error", returns err("error")
```

## Combinators

### `and<T, E, U>(result: Result<T, E>, other: Result<U, E>): Result<U, E>`

Returns the second result if the first is `Ok`, otherwise returns the first result.

```ts
and(ok("first"), ok("second")); // ok("second")
and(ok("first"), err("error")); // err("error")
and(err("error"), ok("second")); // err("error")
```

### `andThen<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E>`

Applies the function to the contained value if `Ok`, otherwise returns the error unchanged.

```ts
andThen(ok(5), (x) => ok(x * 2)); // ok(10)
andThen(ok(5), (x) => err("function error")); // err("function error")
andThen(err("error"), (x) => ok(x * 2)); // err("error")
```

### `or<T, E, F>(result: Result<T, E>, other: Result<T, F>): Result<T, F>`

Returns the first result if it's `Ok`, otherwise returns the second result.

```ts
or(ok("first"), ok("second")); // ok("first")
or(ok("first"), err("error")); // ok("first")
or(err("error"), ok("second")); // ok("second")
or(err("first"), err("second")); // err("second")
```

### `orElse<T, E, F>(result: Result<T, E>, fn: (error: E) => Result<T, F>): Result<T, F>`

Returns the result unchanged if `Ok`, otherwise applies the function to the error.

```ts
orElse(ok("value"), (e) => ok(`recovered: ${e}`)); // ok("value")
orElse(err("error"), (e) => ok(`recovered: ${e}`)); // ok("recovered: error")
orElse(err("error"), (e) => err("new error")); // err("new error")
```

# API Reference

## Two API Styles

seika provides two equivalent APIs:

### Functional API

```ts
import { ok, err, map, unwrap } from "seika";

const result = map(ok(5), (x) => x * 2);
const value = unwrap(result); // 10
```

### Class-based API

```ts
import { Res } from "seika/class";

const result = Res.ok(5).map((x) => x * 2);
const value = result.unwrap(); // 10
```

## Conversion Functions

### `Res.from<T, E>(result: Result<T, E>): Res<T, E>`

Converts a functional `Result<T, E>` to a class-based `Res<T, E>`.

```ts
import { ok } from "seika";
import { Res } from "seika/class";

const functionalResult = ok(42);
const classResult = Res.from(functionalResult);
console.log(classResult.unwrap()); // 42
```

## Class-based Methods

All methods available in the functional API are also available as methods on the `Res` class:

```ts
// Static factory methods
Res.ok<T>(value: T): Res<T, never>
Res.err<E>(error: E): Res<never, E>
Res.from<T, E>(result: Result<T, E>): Res<T, E>  // Convert from functional API

// Instance methods (same behavior as functional API)
.isOk(): boolean
.isErr(): boolean
.isOkAnd(predicate: (value: T) => boolean): boolean
.isErrAnd(predicate: (error: E) => boolean): boolean
.ok(): T | undefined
.err(): E | undefined
.map<U>(fn: (value: T) => U): Res<U, E>
.mapOr<U>(defaultValue: U, fn: (value: T) => U): U
.mapOrElse<U>(fallback: (error: E) => U, fn: (value: T) => U): U
.mapErr<F>(fn: (error: E) => F): Res<T, F>
.inspect(fn: (value: T) => void): Res<T, E>
.inspectErr(fn: (error: E) => void): Res<T, E>
.expect(message: string): T
.unwrap(): T
.unwrapOr(defaultValue: T): T
.unwrapOrElse(fn: (error: E) => T): T
.expectErr(message: string): E
.unwrapErr(): E
.and<U>(other: Res<U, E>): Res<U, E>
.andThen<U>(fn: (value: T) => Res<U, E>): Res<U, E>
.or<F>(other: Res<T, F>): Res<T, F>
.orElse<F>(fn: (error: E) => Res<T, F>): Res<T, F>

// Additional class-specific methods
.toString(): string  // "Ok(value)" or "Err(error)"
.toJSON(): object   // { kind: "ok", value: T } or { kind: "err", error: E }
```
