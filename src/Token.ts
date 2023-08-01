import type { Token } from "./types";

export const isToken = (potentialToken: number | Token): potentialToken is Token => {
  if (typeof potentialToken === "object") {
    const keys = Object.keys(potentialToken);
    return keys.includes("lexeme");
  }

  return false;
};
