import type { TokenEnum } from "./enums";

export interface Token {
  type: TokenEnum;
  lexeme: string;
  literal: undefined | string | number;
  line: number;
  flag?: string;
}

export type Literal = undefined | string | number | null | boolean;
export type IterableScanner = Generator<Token, Token, unknown>;
export type ErrorFn = (lineOrToken: number | Token, message: string) => void;
