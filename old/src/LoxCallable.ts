import { Interpreter } from "./Interpreter";

export abstract class LoxCallable {
  abstract arity: number;
  abstract call(interpreter: Interpreter, args: any[]): any;
}
