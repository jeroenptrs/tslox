import { RuntimeError } from "./RuntimeError";
import { Token } from "./Token";

export class Environment {
  private values: Record<string, any> = {};

  public get(name: Token): any {
    if (!Object.keys(this.values).includes(name.lexeme)) {
      throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
    }

    return this.values[name.lexeme];
  }

  public define(name: string, value: any): void {
    this.values[name] = value;
  }

  public assign(name: Token, value: any): void {
    if (!Object.keys(this.values).includes(name.lexeme)) {
      throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
    }

    this.values[name.lexeme] = value;
  }
}
