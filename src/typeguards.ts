import type { InterpretIterable, Token } from "./types";

export function isIterable(obj: unknown): obj is InterpretIterable {
  return Symbol.iterator in Object(obj);
}

export const isToken = (potentialToken: number | Token): potentialToken is Token => {
  if (typeof potentialToken === "object") {
    const keys = Object.keys(potentialToken);
    return keys.includes("lexeme");
  }

  return false;
};
