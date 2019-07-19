import { RuntimeError } from "./RuntimeError";
import { Token } from "./Token";

export class Environment {
  private readonly enclosing: Environment | null;
  private values: Record<string, any> = {};

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing || null;
  }

  public get(name: Token): any {
    if (Object.keys(this.values).includes(name.lexeme)) {
      return this.values[name.lexeme];
    }

    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }

  public define(name: string, value: any): void {
    this.values[name] = value;
  }

  public assign(name: Token, value: any): void {
    if (Object.keys(this.values).includes(name.lexeme)) {
      this.values[name.lexeme] = value;
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }
}
