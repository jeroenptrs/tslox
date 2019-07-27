import { RuntimeError } from "./RuntimeError";
import { Token } from "./Token";

export class Environment {
  private values: Record<string, any> = {};
  public readonly enclosing: Environment | null;

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

  public getAt(distance: number, name: string): any {
    return this.ancestor(distance).values[name];
  }

  public assignAt(distance: number, name: Token, value: any): void {
    this.ancestor(distance).values[name.lexeme] = value;
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

  ancestor(distance: number) {
    let environment: Environment = this;

    for (let i = 0; i < distance; i++) {
      if (environment.enclosing !== null) environment = environment.enclosing;
    }

    return environment;
  }
}
