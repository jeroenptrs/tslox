import type Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxInstance from "./LoxInstance";
import type LoxFun from "./LoxFun";
import type { Value } from "../types";

export default class LoxClass extends LoxCallable {
  constructor(
    readonly name: string,
    private superclass: LoxClass | null,
    private readonly methods: Map<string, LoxFun>
  ) {
    super();
  }

  public call(interpreter: Interpreter, args: Value[]) {
    const instance = new LoxInstance(this);
    const init = this.findMethod("init");

    if (init !== null) {
      init.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  public findMethod(name: string): LoxFun | null {
    if (this.methods.has(name)) {
      return this.methods.get(name) as LoxFun;
    }

    if (this.superclass !== null) {
      return this.superclass.findMethod(name);
    }

    return null;
  }

  get arity() {
    const init = this.findMethod("init");
    return init === null ? 0 : init.arity;
  }

  override toString() {
    return this.name;
  }
}
