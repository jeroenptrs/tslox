import ParseError from "./ParseError";
import { isToken } from "./typeguards";
import { TokenEnum } from "./enums";
import Interpreter, { RuntimeError } from "./interpreter";
import parser from "./parser";
import Resolver from "./resolver";
import type { ErrorFn, RuntimeErrorFn } from "./types";
import errorPrinter from "errorPrinter";

let hadError = false;
let hadRuntimeError = false;

export default function lox(source: string) {
  hadError = false;
  hadRuntimeError = false;

  try {
    const interpreter = new Interpreter(console.log, runtimeError);
    const iterableParser = parser(source, error);
    const resolver = new Resolver(interpreter, error);
    resolver.resolve(iterableParser);

    if (hadError || hadRuntimeError) {
      return false;
    }

    interpreter.interpret();
    return true;
  } catch (error) {
    if (error instanceof ParseError) {
      errorPrinter(source, error);
    }

    if (error instanceof RuntimeError) {
      errorPrinter(source, error);
    }

    return false;
  }
}

function report(line: number, where: string, message: string, lexeme?: string, col?: number) {
  hadError = true;
  throw new ParseError(`Parse Error${where}: ${message}`, line, lexeme, col);
}

// TODO: error should use tokens to recreate a trace.
const error: ErrorFn = (lineOrToken, message) => {
  if (isToken(lineOrToken)) {
    report(
      lineOrToken.line,
      lineOrToken.type === TokenEnum.EOF ? " at end" : ` at '${lineOrToken.lexeme}'`,
      message,
      lineOrToken.lexeme,
      lineOrToken.col
    );
  } else {
    report(lineOrToken, "", message);
  }
};

const runtimeError: RuntimeErrorFn = (error) => {
  hadRuntimeError = true;

  throw new RuntimeError(error.token, `Runtime Error: ${error.message}`);
};
