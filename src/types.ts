import type { TokenEnum } from "./enums";

export interface Token {
  type: TokenEnum;
  lexeme: string;
  literal: undefined | string | number;
  line: number;
  flag?: string;
}

export type Literal = undefined | string | number;
export type ScannerFn = (source: string, index: number) => RegExpExecArray | null;
export type ErrorFn = (lineOrToken: number | Token, message: string) => void;
