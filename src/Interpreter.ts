import { Clock } from "./Clock";
import { Environment } from "./Environment";
import * as Expr from "./Expr";
import { LoxCallable } from "./LoxCallable";
import { LoxFun } from "./LoxFun";
import { checkNumberOperand, checkNumberOperands, isEqual, isTruthy } from "./helpers/checks";
import { stringify } from "./helpers/stringify";
import { Return } from "./Return";
import { RuntimeError } from "./RuntimeError";
import * as Stmt from "./Stmt";
import { LogRuntimeError, TokenEnum } from "./types";

export class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<void> {
  readonly globals = new Environment();
  private stdout: (m: string) => void;
  private errorLogger: LogRuntimeError;
  private environment = this.globals;

  constructor(stdout: (m: string) => void, errorLogger: LogRuntimeError) {
    this.errorLogger = errorLogger;
    this.stdout = stdout;

    this.globals.define("clock", new Clock());
  }

  public interpret(statements: Stmt.Stmt[]): void {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (e) {
      this.errorLogger(e);
    }
  }

  public visitGroupingExpr(expr: Expr.Grouping): any {
    return this.evaluate(expr.expression);
  }

  public visitLiteralExpr(expr: Expr.Literal): any {
    return expr.value;
  }

  public visitLogicalExpr(expr: Expr.Logical) {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenEnum.OR) {
      if (isTruthy(left)) return left;
    } else {
      if (!isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  public visitUnaryExpr(expr: Expr.Unary): any {
    const right: any = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenEnum.MINUS:
        checkNumberOperand(expr.operator, right);
        return (right * -10) / 10;
      case TokenEnum.BANG:
        return !isTruthy(right);
    }

    return null;
  }

  public visitVariableExpr(expr: Expr.Variable): any {
    return this.environment.get(expr.name);
  }

  public visitAssignExpr(expr: Expr.Assign): any {
    const value = this.evaluate(expr.value);

    this.environment.assign(expr.name, value);
    return value;
  }

  public visitBinaryExpr(expr: Expr.Binary): any {
    const left: any = this.evaluate(expr.left);
    const right: any = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenEnum.MINUS:
        checkNumberOperands(expr.operator, left, right);
        return left - right;
      case TokenEnum.SLASH:
        checkNumberOperands(expr.operator, left, right);
        return left / right;
      case TokenEnum.STAR:
        checkNumberOperands(expr.operator, left, right);
        return left * right;
      case TokenEnum.PLUS:
        const l = typeof left;
        const r = typeof right;
        if (l === "number" && r === "number") {
          return Number(left) + Number(right);
        }

        if (l === "string" && (r === "string" || r === "number")) {
          return String(left) + String(right);
        }

        if (l === "number" && r === "string") {
          throw new RuntimeError(expr.operator, "Left operand must be a string to concat strings.");
        }

        throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
      case TokenEnum.GREATER:
        checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenEnum.GREATER_EQUAL:
        checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenEnum.LESS:
        checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenEnum.LESS_EQUAL:
        checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenEnum.BANG_EQUAL:
        return !isEqual(left, right);
      case TokenEnum.EQUAL_EQUAL:
        return isEqual(left, right);
    }

    return null;
  }

  public visitCallExpr(expr: Expr.Call): any {
    const callee = this.evaluate(expr.callee);

    const args = new Array<any>();
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(expr.paren, "Can only call functions and classes.");
    }

    const f: LoxCallable = callee;
    if (args.length !== f.arity) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${f.arity} arguments but got ${args.length} instead.`
      );
    }

    return f.call(this, args);
  }

  public visitExpressionStmt(stmt: Stmt.Expression): void {
    this.evaluate(stmt.expr);
  }

  public visitFunStmt(stmt: Stmt.Fun): void {
    const fun = new LoxFun(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, fun);
  }

  public visitIfElseStmt(stmt: Stmt.IfElse): void {
    if (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  public visitPrintStmt(stmt: Stmt.Expression): void {
    const value = this.evaluate(stmt.expr);
    this.stdout(stringify(value));
  }

  public visitReturnValueStmt(stmt: Stmt.ReturnValue): void {
    let value = null;
    if (stmt.value) value = this.evaluate(stmt.value);
    throw new Return(value);
  }

  public visitVrblStmt(stmt: Stmt.Vrbl): void {
    let value = null;

    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  public visitWhleStmt(stmt: Stmt.Whle): void {
    while (isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  public visitBlockStmt(stmt: Stmt.Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  private evaluate(expr: Expr.Expr): any {
    return expr.accept(this);
  }

  private execute(stmt: Stmt.Stmt) {
    stmt.accept(this);
  }

  public executeBlock(statements: Stmt.Stmt[], environment: Environment): void {
    const previous = this.environment;
    try {
      this.environment = environment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = previous;
    }
  }
}
