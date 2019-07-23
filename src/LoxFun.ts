import { Return } from "./Return";

import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";
import * as Stmt from "./Stmt";

export class LoxFun extends LoxCallable {
  private readonly declaration: Stmt.Fun;
  private closure: Environment;

  constructor(declaration: Stmt.Fun, closure: Environment) {
    super();

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
      const R = e as Return;
      return R.value;
    }

    return null;
  }

  get arity() {
    return this.declaration.params.length;
  }

  toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
