import { Token } from "../Token";
import { TokenEnum } from "../types";
import { RuntimeError } from "src/RuntimeError";

let _error = false;
let _runtimeError = false;

export function hadError() {
  return _error;
}

export function flagError() {
  _error = true;
}

export function hadRuntimeError() {
  return _runtimeError;
}

export function flagRuntimeError() {
  _runtimeError = true;
}

export function error(lineId: Token, message: string): void;
export function error(lineId: number, message: string): void;
export function error(lineId: number | Token, message: string): void {
  if (typeof lineId === "number") report(lineId, "", message);
  else if (lineId.type)
    report(
      lineId.line,
      lineId.type === TokenEnum.EOF ? " at end" : `at '${lineId.lexeme}'`,
      message
    );
}

export function runtimeError(error: RuntimeError): void {
  console.error(`${error.message}\n[line ${error.token.line}]`);
  flagRuntimeError();
}

export function report(line: number, where: string, message: string) {
  console.error(`[line: ${line}]: Error ${where}: ${message}`);
  flagError();
}
