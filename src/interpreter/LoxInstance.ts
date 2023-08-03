import LoxClass from "./LoxClass";
import RuntimeError from "./RuntimeError";
import type { Token, Value } from "../types";

export default class LoxInstance {
  private readonly fields = new Map<string, Value>();

  constructor(private cls: LoxClass) {}

  public get(name: Token): Value {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme) as Value;
    }

    const method = this.cls.findMethod(name.lexeme);
    if (method !== null) return method.bind(this);

    throw new RuntimeError(name, `Undefined property ${name.lexeme}.`);
  }

  public set(name: Token, value: Value) {
    this.fields.set(name.lexeme, value);
  }

  public toString(): string {
    return `${this.cls.name} instance`;
  }
}
