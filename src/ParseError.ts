import { Token } from "./types";

export default class ParseError extends Error {
  constructor(
    override readonly message: string,
    readonly line: number,
    readonly lexeme?: string,
    readonly tokens?: Token[]
  ) {
    super(message);

    Object.setPrototypeOf(this, ParseError.prototype);
  }
}
