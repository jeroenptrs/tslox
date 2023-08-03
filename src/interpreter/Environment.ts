import type { Token, Value } from "../types";
import { RuntimeError } from "./RuntimeError";
import * as errors from "./errors";

export default class Environment {
  readonly values = new Map<string, Value>();

  constructor(readonly enclosing: Environment | null = null) {}

  public get(name: Token): Value {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme) as Value;
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, errors.undefinedVar(name.lexeme));
  }

  public getAt(distance: number, name: string): Value {
    return this.ancestor(distance).values.get(name) as Value;
  }

  public assignAt(distance: number, name: Token, value: Value): void {
    this.ancestor(distance).values.set(name.lexeme, value);
  }

  public define(name: string, value: Value): void {
    this.values.set(name, value);
  }

  public assign(name: Token, value: Value): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, errors.undefinedVar(name.lexeme));
  }

  public ancestor(distance: number) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let environment: Environment = this;

    for (let i = 0; i < distance; i++) {
      if (environment.enclosing !== null) {
        environment = environment.enclosing;
      }
    }

    return environment;
  }
}
