import { Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";
import { LoxInstance } from "./LoxInstance";
import { LoxFun } from "./LoxFun";

export class LoxClass extends LoxCallable {
  readonly name: string;
  private readonly methods: Record<string, LoxFun>;
  private superclass: LoxClass | null;

  constructor(name: string, superclass: LoxClass | null, methods: Record<string, LoxFun>) {
    super();

    this.name = name;
    this.superclass = superclass;
    this.methods = methods;
  }

  // @ts-ignore
  public call(interpreter: Interpreter, args: any[]) {
    const instance = new LoxInstance(this);
    const init = this.findMethod("init");

    if (init !== null) {
      init.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  public findMethod(name: string): LoxFun | null {
    if (Object.keys(this.methods).includes(name)) {
      return this.methods[name];
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

  toString() {
    return this.name;
  }
}
