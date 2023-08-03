import ParseError from "./ParseError";
import { isToken } from "./typeguards";
import { TokenEnum } from "./enums";
import Interpreter from "./interpreter";
import parser from "./parser";
import Resolver from "./resolver";
import type { ErrorFn, RuntimeErrorFn } from "./types";

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
      // console.log("--------------------");
      console.log(error.message);
      // console.log("--------------------");
      // const { line, tokens } = error;
      // console.log(
      //   `${line}:`,
      //   tokens
      //     ?.filter((token) => token.line === line)
      //     .map((token) => token.lexeme)
      //     .join(" ")
      // );
      // console.log("--------------------");
    }

    return false;
  }
}

function report(line: number, where: string, message: string, lexeme?: string) {
  hadError = true;
  throw new ParseError(`[line: ${line}]: Error${where}: ${message}`, line, lexeme);
}

// TODO: error should use tokens to recreate a trace.
const error: ErrorFn = (lineOrToken, message) => {
  if (isToken(lineOrToken)) {
    report(
      lineOrToken.line,
      lineOrToken.type === TokenEnum.EOF ? " at end" : ` at '${lineOrToken.lexeme}'`,
      message,
      lineOrToken.lexeme
    );
  } else {
    report(lineOrToken, "", message);
  }
};

const runtimeError: RuntimeErrorFn = (error) => {
  if (error.token) {
    console.error(`${error.message}\n[line ${error!.token!.line}]`);
    hadRuntimeError = true;
  }
};
