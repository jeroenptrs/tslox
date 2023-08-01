import { isAlpha } from "./Alpha";
import { isDigit } from "./Digit";

export const isAlphaNumeric = (c: string) => isAlpha(c) || isDigit(c);
