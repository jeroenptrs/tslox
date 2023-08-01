import scanner from "./scanner";
import { isToken } from "./Token";
import { TokenEnum } from "./enums";
import type { ErrorFn } from "./types";
import { src } from "./test/src";

let hadError = false;
function report(line: number, where: string, message: string) {
  hadError = true;
  console.error(`[line: ${line}]: Error ${where}: ${message}`);
}
const error: ErrorFn = (lineOrToken, message) => {
  if (isToken(lineOrToken)) {
    report(
      lineOrToken.line,
      lineOrToken.type === TokenEnum.EOF ? " at end" : `at '${lineOrToken.lexeme}'`,
      message
    );
  } else {
    report(lineOrToken, "", message);
  }
};

console.log(Array.from(scanner(src, error)));
hadError;
