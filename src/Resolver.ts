import * as Expr from "./Expr";
import { Interpreter } from "./Interpreter";
import * as Stmt from "./Stmt";
import { Token } from "./Token";
import { LogError } from "./types";

enum FnType {
  NONE = 0,
  FN,
  INITIALIZER,
  METHOD,
}

enum ClsType {
  NONE = 0,
  CLASS,
  SUBCLASS,
}

export class Resolver implements Expr.Visitor<any>, Stmt.Visitor<any> {
  private readonly interpreter: Interpreter;
  private readonly scopes: Record<string, boolean>[] = [];
  private errorLogger: LogError;
  private currentFunction: FnType = FnType.NONE;
  private currentClass: ClsType = ClsType.NONE;

  constructor(interpreter: Interpreter, errorLogger: LogError) {
    this.interpreter = interpreter;
    this.errorLogger = errorLogger;
  }

  public visitBlockStmt(stmt: Stmt.Block): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  public visitClsStmt(stmt: Stmt.Cls): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClsType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (stmt.superclass !== null) {
      if (stmt.name.lexeme === stmt.superclass.name.lexeme)
        this.errorLogger(stmt.superclass.name, "A class cannot inherit from itself.");
      else {
        this.currentClass = ClsType.SUBCLASS;
        this.resolve(stmt.superclass);
      }

      this.beginScope();
      this.scopes[this.scopes.length - 1]["super"] = true;
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1]["this"] = true;

    for (const method of stmt.methods) {
      const declaration = method.name.lexeme === "init" ? FnType.INITIALIZER : FnType.METHOD;
      this.resolveFunction(method, declaration);
    }

    this.endScope();

    if (stmt.superclass !== null) this.endScope();

    this.currentClass = enclosingClass;
  }

  public visitExpressionStmt(stmt: Stmt.Expression): void {
    this.resolve(stmt.expr);
  }

  public visitFunStmt(stmt: Stmt.Fun): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FnType.FN);
  }

  public visitIfElseStmt(stmt: Stmt.IfElse): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);

    if (stmt.elseBranch !== null) this.resolve(stmt.elseBranch);
  }

  public visitPrintStmt(stmt: Stmt.Print): void {
    this.resolve(stmt.expr);
  }

  public visitReturnValueStmt(stmt: Stmt.ReturnValue): void {
    if (this.currentFunction === FnType.NONE) {
      this.errorLogger(stmt.keyword, "Cannot return from top-level code.");
    }

    if (stmt.value !== null) {
      if (this.currentFunction === FnType.INITIALIZER) {
        this.errorLogger(stmt.keyword, "Cannot return a value from an initializer");
      }

      this.resolve(stmt.value);
    }
  }

  public visitVrblStmt(stmt: Stmt.Vrbl): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) this.resolve(stmt.initializer);
    this.define(stmt.name);
  }

  public visitWhleStmt(stmt: Stmt.Whle): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  public visitAssignExpr(expr: Expr.Assign): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  public visitBinaryExpr(expr: Expr.Binary): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitCallExpr(expr: Expr.Call): void {
    this.resolve(expr.callee);

    for (const arg of expr.args) {
      this.resolve(arg);
    }
  }

  public visitGetExpr(expr: Expr.Get): void {
    this.resolve(expr.obj);
  }

  public visitGroupingExpr(expr: Expr.Grouping): void {
    this.resolve(expr.expression);
  }

  /**
   * Ignore the expr argument in visitLiteralExpr.
   * We need to conform to the Visitor definition,
   * but we won't actually do something with it.
   */
  // @ts-ignore
  public visitLiteralExpr(expr: Expr.Literal): void {
    return;
  }

  public visitLogicalExpr(expr: Expr.Logical): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  public visitSetExpr(expr: Expr.Set): void {
    this.resolve(expr.value);
    this.resolve(expr.obj);
  }

  public visitSprExpr(expr: Expr.Spr): void {
    if (this.currentClass === ClsType.NONE) {
      this.errorLogger(expr.keyword, "Cannot use 'super' outside of a class.");
    } else if (this.currentClass !== ClsType.SUBCLASS) {
      this.errorLogger(expr.keyword, "Cannot use 'super' in a class with no superclass.");
    }

    this.resolveLocal(expr, expr.keyword);
  }

  public visitThsExpr(expr: Expr.Ths): void {
    if (this.currentClass === ClsType.NONE) {
      this.errorLogger(expr.keyword, "Cannot use 'this' outside of a class.");
      return;
    }

    this.resolveLocal(expr, expr.keyword);
  }

  public visitUnaryExpr(expr: Expr.Unary): void {
    this.resolve(expr.right);
  }

  public visitVariableExpr(expr: Expr.Variable): void {
    if (this.scopes.length !== 0 && this.peek()[expr.name.lexeme] === false) {
      this.errorLogger(expr.name, "Cannot read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }

  resolve(statements: Stmt.Stmt[]): void;
  resolve(statement: Stmt.Stmt): void;
  resolve(expression: Expr.Expr): void;
  resolve(s: Expr.Expr | Stmt.Stmt | Stmt.Stmt[]): void {
    if (Array.isArray(s)) for (const statement of s) this.resolve(statement);
    else if (s instanceof Stmt.Stmt) s.accept(this);
    else if (s instanceof Expr.Expr) s.accept(this);
  }

  private resolveFunction(fun: Stmt.Fun, type: FnType): void {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();

    for (const param of fun.params) {
      this.declare(param);
      this.define(param);
    }

    this.resolve(fun.funBody);
    this.endScope();

    this.currentFunction = enclosingFunction;
  }

  private beginScope(): void {
    this.scopes.push({} as Record<string, boolean>);
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private peek = () => this.scopes[this.scopes.length - 1];

  private declare(name: Token): void {
    if (this.scopes.length === 0) return;
    const scope = this.scopes[this.scopes.length - 1];
    if (Object.keys(scope).includes(name.lexeme))
      this.errorLogger(name, "Variable with this name already declared in this scope.");
    scope[name.lexeme] = false;
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return;
    this.scopes[this.scopes.length - 1][name.lexeme] = true;
  }

  private resolveLocal(expr: Expr.Expr, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (Object.keys(this.scopes[i]).includes(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }

    // Not found. Assume it's global.
  }
}
