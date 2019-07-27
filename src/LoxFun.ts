import { Return } from "./Return";

import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";
import * as Stmt from "./Stmt";
import { LoxInstance } from "./LoxInstance";

export class LoxFun extends LoxCallable {
  private readonly declaration: Stmt.Fun;
  private readonly isInitializer: boolean;
  private closure: Environment;

  constructor(declaration: Stmt.Fun, closure: Environment, isInititalizer: boolean) {
    super();

    this.isInitializer = isInititalizer;
    this.declaration = declaration;
    this.closure = closure;
  }

  public call(interpreter: Interpreter, args: any[]) {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.funBody, environment);
    } catch (e) {
      if (this.isInitializer) return this.closure.getAt(0, "this");
      const R = e as Return;
      return R.value;
    }

    if (this.isInitializer) return this.closure.getAt(0, "this");

    return null;
  }

  public bind(instance: LoxInstance): LoxFun {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFun(this.declaration, environment, this.isInitializer);
  }

  get arity() {
    return this.declaration.params.length;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
