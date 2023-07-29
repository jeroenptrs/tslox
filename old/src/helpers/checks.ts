import { RuntimeError } from "../RuntimeError";
import { Token } from "../Token";

export function checkNumberOperand(operator: Token, operand: any): void {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "Operand must be a number.");
}

export function checkNumberOperands(operator: Token, left: any, right: any): void {
  if (typeof left === "number" && typeof right === "number") return;
  throw new RuntimeError(operator, "Operands must be numbers.");
}

export function isTruthy(object: any): boolean {
  if (object === null) return false;
  if (typeof object === "boolean") return Boolean(object);
  return true;
}

export function isEqual(a: any, b: any): boolean {
  if (a === null && b === null) return true;
  if (a === null) return false;
  return a === b;
}
