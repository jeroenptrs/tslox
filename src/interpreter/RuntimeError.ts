import type { Token } from "../types";

export default class RuntimeError extends Error {
  constructor(
    readonly token: Token,
    override readonly message: string
  ) {
    super(message);

    Object.setPrototypeOf(this, RuntimeError.prototype);
  }
}
