import type Interpreter from "./Interpreter";
import type { Value } from "../types";

export default abstract class LoxCallable {
  abstract arity: number;
  abstract call(interpreter: Interpreter, args: Value[]): Value;
}
