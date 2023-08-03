import * as Expression from "../Expression";
import * as Statement from "../Statement";
import { ClassType, FunType } from "../enums";
import Interpreter from "../interpreter";
import { isIterable } from "../typeguards";
import type { ErrorFn, InterpretResolve, Token } from "../types";
import * as errors from "./errors";

export default class Resolver implements Expression.Visitor<void>, Statement.Visitor<void> {
  private readonly scopes: Map<string, boolean>[] = [];
  private currentFunction: FunType = FunType.NONE;
  private currentClass: ClassType = ClassType.NONE;

  constructor(
    private interpreter: Interpreter,
    private errorLogger: ErrorFn
  ) {}

  // --------------------RESOLVING--------------------

  resolve(statements: Generator<Statement.Statement, void, unknown>): void;
  resolve(statements: Statement.Statement[]): void;
  resolve(statement: Statement.Statement): void;
  resolve(expression: Expression.Expression): void;
  resolve(s: InterpretResolve): void {
    if (isIterable(s)) {
      for (const statement of s) {
        this.resolve(statement);

        if (!Array.isArray(s)) {
          this.interpreter.addStatement(statement);
        }
      }
    } else if (s instanceof Statement.Statement) {
      s.accept(this);
    } else if (s instanceof Expression.Expression) {
      s.accept(this);
    }
  }

  private resolveFunction(fun: Statement.Fun, type: FunType): void {
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

  private resolveLocal(expression: Expression.Expression, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i]?.has(name.lexeme)) {
        this.interpreter.resolve(expression, this.scopes.length - 1 - i);
        return;
      }
    }

    // Not found. Assume it's global.
  }

  // --------------------STATEMENT--------------------

  public visitBlockStatement(block: Statement.Block): void {
    this.beginScope();
    this.resolve(block.statements);
    this.endScope();
  }

  public visitLoxClassStatement(loxClass: Statement.LoxClass): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(loxClass.name);
    this.define(loxClass.name);

    if (loxClass.superclass !== null) {
      if (loxClass.name.lexeme === loxClass.superclass.name.lexeme) {
        this.errorLogger(loxClass.superclass.name, errors.inheritItself);
      } else {
        this.currentClass = ClassType.SUBCLASS;
        this.resolve(loxClass.superclass);
      }

      this.beginScope();
      this.scopes[this.scopes.length - 1]?.set("super", true);
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1]?.set("this", true);

    for (const method of loxClass.methods) {
      const declaration = method.name.lexeme === "init" ? FunType.INITIALIZER : FunType.METHOD;
      this.resolveFunction(method, declaration);
    }

    this.endScope();

    if (loxClass.superclass !== null) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
  }

  public visitExpressionStatement(expression: Statement.Expression): void {
    this.resolve(expression.expr);
  }

  public visitFunStatement(fun: Statement.Fun): void {
    this.declare(fun.name);
    this.define(fun.name);
    this.resolveFunction(fun, FunType.FUN);
  }

  public visitIfElseStatement(ifElse: Statement.IfElse): void {
    this.resolve(ifElse.condition);
    this.resolve(ifElse.thenBranch);

    if (ifElse.elseBranch !== null) {
      this.resolve(ifElse.elseBranch);
    }
  }

  public visitPrintStatement(print: Statement.Print): void {
    this.resolve(print.expr);
  }

  public visitReturnValueStatement(returnValue: Statement.ReturnValue): void {
    if (this.currentFunction === FunType.NONE) {
      this.errorLogger(returnValue.keyword, errors.returnFromTop);
    }

    if (returnValue.value !== null) {
      if (this.currentFunction === FunType.INITIALIZER) {
        this.errorLogger(returnValue.keyword, errors.returnFromInit);
      }

      this.resolve(returnValue.value);
    }
  }

  public visitVariableStatement(variable: Statement.Variable): void {
    this.declare(variable.name);
    if (variable.initializer !== null) {
      this.resolve(variable.initializer);
    }
    this.define(variable.name);
  }

  public visitLoxWhileStatement(loxWhile: Statement.LoxWhile): void {
    this.resolve(loxWhile.condition);
    this.resolve(loxWhile.body);
  }

  // --------------------EXPRESSION-------------------

  public visitAssignExpression(assign: Expression.Assign): void {
    this.resolve(assign.value);
    this.resolveLocal(assign, assign.name);
  }

  public visitBinaryExpression(binary: Expression.Binary): void {
    this.resolve(binary.left);
    this.resolve(binary.right);
  }

  public visitCallExpression(call: Expression.Call): void {
    this.resolve(call.callee);

    for (const arg of call.args) {
      this.resolve(arg);
    }
  }

  public visitGetExpression(get: Expression.Get): void {
    this.resolve(get.obj);
  }

  public visitGroupingExpression(grouping: Expression.Grouping): void {
    this.resolve(grouping.expression);
  }

  public visitLiteralExpression(literal: Expression.Literal): void {
    literal;
  }

  public visitLogicalExpression(logical: Expression.Logical): void {
    this.resolve(logical.left);
    this.resolve(logical.right);
  }

  public visitSetExpression(set: Expression.Set): void {
    this.resolve(set.value);
    this.resolve(set.obj);
  }

  public visitLoxSuperExpression(loxSuper: Expression.LoxSuper): void {
    if (this.currentClass === ClassType.NONE) {
      this.errorLogger(loxSuper.keyword, errors.useSuperClass);
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      this.errorLogger(loxSuper.keyword, errors.userSuperSuperClass);
    }

    this.resolveLocal(loxSuper, loxSuper.keyword);
  }

  public visitLoxThisExpression(loxThis: Expression.LoxThis): void {
    if (this.currentClass === ClassType.NONE) {
      this.errorLogger(loxThis.keyword, errors.useThis);
      return;
    }

    this.resolveLocal(loxThis, loxThis.keyword);
  }

  public visitUnaryExpression(unary: Expression.Unary): void {
    this.resolve(unary.right);
  }

  public visitVariableExpression(variable: Expression.Variable): void {
    if (this.scopes.length !== 0 && this.peek()?.get(variable.name.lexeme) === false) {
      this.errorLogger(variable.name, errors.readItself);
    }

    this.resolveLocal(variable, variable.name);
  }

  // ----------------------MISC.----------------------

  private beginScope(): void {
    const scope = new Map<string, boolean>();
    this.scopes.push(scope);
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private peek = () => this.scopes[this.scopes.length - 1];

  private declare(name: Token): void {
    if (this.scopes.length === 0) {
      return;
    }

    const scope = this.scopes[this.scopes.length - 1];

    if (scope?.has(name.lexeme)) {
      this.errorLogger(name, errors.alreadyDeclared);
    }

    scope?.set(name.lexeme, false);
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) {
      return;
    }

    this.scopes[this.scopes.length - 1]?.set(name.lexeme, true);
  }
}
