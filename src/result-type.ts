export type Result<T, E> =
	| {
			kind: "ok";
			inner: T;
	  }
	| {
			kind: "err";
			inner: E;
	  };
