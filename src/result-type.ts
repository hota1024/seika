export type Result<T, E> =
  | {
      kind: "ok";
      inner: T;
    }
  | {
      kind: "err";
      inner: E;
    };

export type Unwrap<R extends Result<unknown, unknown>> = Exclude<
  R,
  { kind: "err" }
>["inner"];

export type UnwrapErr<R extends Result<unknown, unknown>> = Exclude<
  R,
  { kind: "ok" }
>["inner"];
