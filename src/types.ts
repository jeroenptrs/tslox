import { Expression } from "./Expression";
import type { Statement } from "./Statement";
import type { TokenEnum } from "./enums";
import type { LoxCallable, LoxClass, LoxInstance, RuntimeError } from "./interpreter";

export interface Token {
  type: TokenEnum;
  lexeme: string;
  literal: undefined | string | number;
  line: number;
  flag?: string;
}

export type Value = null | string | number | boolean | LoxCallable | LoxClass | LoxInstance;

export type Literal = undefined | string | number | null | boolean;
export type IterableScanner = Generator<Token, Token, unknown>;
export type ErrorFn = (lineOrToken: number | Token, message: string) => void;
export type RuntimeErrorFn = (error: RuntimeError) => void;
export type OutFn = typeof console.log;

export type InterpretResolve =
  | Generator<Statement, void, unknown>
  | Statement[]
  | Statement
  | Expression;
export type InterpretIterable = Generator<Statement, void, unknown> | Statement[];
