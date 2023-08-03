import RuntimeError from "./RuntimeError";
import { Token } from "../types";

export function isEqual(a: unknown, b: unknown): boolean {
  if (a === null && b === null) {
    return true;
  }

  if (a === null) {
    return false;
  }

  return a === b;
}

export function isNumber(operator: Token, operand: unknown): operand is number {
  if (typeof operand === "number") {
    return true;
  }

  throw new RuntimeError(operator, "Operand must be a number.");
}

export function isTruthy(object: unknown): boolean {
  if (object === null) {
    return false;
  }

  if (typeof object === "boolean") {
    return Boolean(object);
  }

  return true;
}
