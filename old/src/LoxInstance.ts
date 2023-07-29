import { LoxClass } from "./LoxClass";
import { Token } from "./Token";
import { RuntimeError } from "./RuntimeError";

export class LoxInstance {
  private cls: LoxClass;
  private readonly fields: Record<string, any> = {};

  constructor(cls: LoxClass) {
    this.cls = cls;
  }

  public get(name: Token): any {
    if (Object.keys(this.fields).includes(name.lexeme)) {
      return this.fields[name.lexeme];
    }

    const method = this.cls.findMethod(name.lexeme);
    if (method !== null) return method.bind(this);

    throw new RuntimeError(name, `Undefined property ${name.lexeme}.`);
  }

  public set(name: Token, value: any) {
    this.fields[name.lexeme] = value;
  }

  public toString(): string {
    return `${this.cls.name} instance`;
  }
}
