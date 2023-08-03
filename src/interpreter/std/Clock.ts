import LoxCallable from "../LoxCallable";
import { Value } from "../../types";

export class Clock extends LoxCallable {
  public arity = 0;

  public call(): Value {
    return Math.floor(Date.now() / 1000);
  }

  public override toString() {
    return "<native fn>";
  }
}
