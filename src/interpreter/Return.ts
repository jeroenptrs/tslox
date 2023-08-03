import type { Value } from "../types";

export default class Return extends Error {
  constructor(public value: Value) {
    super();

    Object.setPrototypeOf(this, Return.prototype);
  }
}
