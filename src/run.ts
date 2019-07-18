// import { AstPrinter } from "./AstPrinter";
import { hadError } from "./helpers/error";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";
import { Interpreter } from "./Interpreter";

export function run(source: string) {
  try {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);
    const statements = parser.parse();
    const interpreter = new Interpreter();

    if (hadError()) return;

    interpreter.interpret(statements);
  } catch (e) {
    return;
  }
}
