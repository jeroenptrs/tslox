import ParseError from "./ParseError";
import { isToken } from "./Token";
import { TokenEnum } from "./enums";
import parser from "./parser";
import scanner from "./scanner";
import { ErrorFn } from "./types";

let hadError = false;

export default function lox(source: string) {
  hadError = false;

  try {
    const iterableParser = parser(scanner(source, error), error);
    console.log(Array.from(iterableParser));
  } catch (error) {
    if (error instanceof ParseError) {
      console.log("--------------------");
      console.log(error.message);
      console.log("--------------------");
      const { line, tokens } = error;
      console.log(
        `${line}:`,
        tokens
          ?.filter((token) => token.line === line)
          .map((token) => token.lexeme)
          .join(" ")
      );
      console.log("--------------------");
    }
  }

  if (hadError) {
    console.error("had error");
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
