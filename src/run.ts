import { AstPrinter } from "./AstPrinter";
import { hadError, hadRuntimeError } from "./helpers/error";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";
import { Interpreter } from "./Interpreter";

export function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens);
  const expression = parser.parse();
  const interpreter = new Interpreter();

  if (hadError()) return;

  interpreter.interpret(expression);
  // console.info(new AstPrinter().print(expression));
}
