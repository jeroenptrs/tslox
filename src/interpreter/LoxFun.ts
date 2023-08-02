import * as Statement from "../Statement";
import type { Token, Value } from "../types";
import Environment from "./Environment";
import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import type LoxInstance from "./LoxInstance";
import Return from "./Return";

export default class LoxFun extends LoxCallable {
  constructor(
    private readonly declaration: Statement.Fun,
    private closure: Environment,
    private readonly isInitializer: boolean
  ) {
    super();
  }

  public call(interpreter: Interpreter, args: Value[]) {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define((this.declaration.params[i] as Token).lexeme, args[i] as Value);
    }

    try {
      interpreter.executeBlock(this.declaration.funBody, environment);
    } catch (e) {
      if (this.isInitializer) {
        return this.closure.getAt(0, "this");
      }

      if (e instanceof Return) {
        return e.value;
      }
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, "this");
    }

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

  override toString() {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
