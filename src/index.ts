// import { AstPrinter } from './AstPrinter';
import { Interpreter } from "./Interpreter";
import { Parser } from "./Parser";
import { Resolver } from "./Resolver";
import { RuntimeError } from "./RuntimeError";
import { Scanner } from "./Scanner";
import { Token } from "./Token";
import { TokenEnum } from "./types";

type PartialConsole = {
  error(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
};

export class Lox {
  private logger: PartialConsole;

  private stdout = (m: string) => this.logger.log(m);
  private runtimeError = (error: RuntimeError) => {
    if (error.token) this.logger.error(`${error.message}\n[line ${error!.token!.line}]`);
    this.hadRuntimeError = true;
  };

  private interpreter: Interpreter = new Interpreter(this.stdout, this.runtimeError);
  private hadError = false;
  private hadRuntimeError = false;

  constructor(logger: PartialConsole = console) {
    this.logger = logger;
  }

  public run(source: string): boolean {
    try {
      const tokens = new Scanner(source, this.error).scanTokens();
      const statements = new Parser(tokens, this.error).parse();
      const resolver = new Resolver(this.interpreter, this.error);
      resolver.resolve(statements);

      const errors = this.hadError || this.hadRuntimeError;
      if (errors) return false;

      this.interpreter.interpret(statements);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  private error = (lineId: number | Token, message: string) => {
    if (typeof lineId === "number") this.report(lineId, "", message);
    else if (Object.keys(lineId).includes("type")) {
      this.report(
        lineId.line,
        lineId.type === TokenEnum.EOF ? " at end" : `at '${lineId.lexeme}'`,
        message
      );
    }
  };

  private report(line: number, where: string, message: string) {
    this.logger.error(`[line: ${line}]: Error ${where}: ${message}`);
    this.hadError = true;
  }
}
