import { LoxCallable } from "./LoxCallable";

export class Clock extends LoxCallable {
  public arity = 0;

  public call(): any {
    return Math.floor(Date.now() / 1000);
  }

  public toString() {
    return "<native fn>";
  }
}
