import { Value } from "../types";

export function stringify(object: Value): string {
  if (object === null) {
    return "nil";
  }

  if (typeof object === "number") {
    let text = object.toString();

    if (text.endsWith(".0")) {
      text = text.substring(0, text.length - 2);
    }

    return text;
  }

  return object.toString();
}
