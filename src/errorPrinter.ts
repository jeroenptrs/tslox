import { RuntimeError } from "./interpreter";
import ParseError from "./ParseError";
import type { Token } from "./types";

export default function errorPrinter(source: string, error: ParseError | RuntimeError): void {
  let line: number;
  let col: number | undefined;

  console.log(error.message);

  if (
    error instanceof ParseError &&
    error.message.startsWith("Parse Error at end") &&
    error.tokens &&
    error.tokens.length > 1
  ) {
    const token = error.tokens[error.tokens.length - 2] as Token; // skip EOF
    line = token?.line;
    col = token?.col;
  } else if (error instanceof ParseError) {
    line = error.line;
    col = error.col;
  } else {
    line = error.token.line;
    col = error.token.col;
  }

  printIndicator(source, line, col);
}

function printIndicator(source: string, line: number, col?: number) {
  if (typeof col === "number") {
    const splitSource = source.split("\n");
    const errorLine = splitSource[line - 1];
    console.log("\nLooks like it's happening right about here:");
    console.log(`${line}: ${errorLine}`);

    const errorIndex = col;
    const indicator = `${new Array(errorIndex + 1).join(" ")}---^`;
    console.log(indicator);
  }
}
