import * as Expression from "../Expression";
import * as Statement from "../Statement";
import { TokenEnum } from "../enums";
import type { OutFn, RuntimeErrorFn, Token, Value } from "../types";
import Environment from "./Environment";
import LoxCallable from "./LoxCallable";
import LoxClass from "./LoxClass";
import LoxFun from "./LoxFun";
import LoxInstance from "./LoxInstance";
import Return from "./Return";
import { RuntimeError } from "./RuntimeError";
import * as errors from "./errors";
import { isEqual, isNumber, isTruthy } from "./helpers";
import { Clock } from "./std/Clock";
import { stringify } from "./stringify";

export default class Interpreter implements Expression.Visitor<Value>, Statement.Visitor<void> {
  readonly globals = new Environment();
  readonly locals = new Map<Expression.Expression, number>();
  private environment = this.globals;
  private statements: Statement.Statement[] = [];

  constructor(
    private stdout: OutFn,
    private errorLogger: RuntimeErrorFn
  ) {
    this.globals.define("clock", new Clock());
  }

  public interpret(): void {
    try {
      for (const statement of this.statements) {
        this.execute(statement);
      }
    } catch (e) {
      if (e instanceof RuntimeError) {
        this.errorLogger(e);
      }
    }
  }

  // --------------------STATEMENT--------------------

  public visitBlockStatement(block: Statement.Block): void {
    this.executeBlock(block.statements, new Environment(this.environment));
  }

  public visitLoxClassStatement(loxClass: Statement.LoxClass): void {
    let superclass = null;
    if (loxClass.superclass !== null) {
      superclass = this.evaluate(loxClass.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(loxClass.superclass.name, errors.superClass);
      }
    }

    this.environment.define(loxClass.name.lexeme, null);

    if (loxClass.superclass !== null && superclass !== null) {
      this.environment = new Environment(this.environment);
      this.environment.define("super", superclass);
    }

    const methods = new Map<string, LoxFun>();
    for (const method of loxClass.methods) {
      const fn = new LoxFun(method, this.environment, method.name.lexeme === "init");
      methods.set(method.name.lexeme, fn);
    }

    const cls = new LoxClass(loxClass.name.lexeme, superclass, methods);

    if (superclass !== null) {
      this.environment = this.environment.enclosing as Environment;
    }

    this.environment.assign(loxClass.name, cls);
  }

  public visitExpressionStatement(expression: Statement.Expression): void {
    this.evaluate(expression.expr);
  }

  public visitFunStatement(fun: Statement.Fun): void {
    this.environment.define(fun.name.lexeme, new LoxFun(fun, this.environment, false));
  }

  public visitIfElseStatement(ifElse: Statement.IfElse): void {
    if (isTruthy(this.evaluate(ifElse.condition))) {
      this.execute(ifElse.thenBranch);
    } else if (ifElse.elseBranch !== null) {
      this.execute(ifElse.elseBranch);
    }
  }

  public visitPrintStatement(print: Statement.Print): void {
    this.stdout(stringify(this.evaluate(print.expr)));
  }

  public visitReturnValueStatement(returnValue: Statement.ReturnValue): void {
    let value = null;

    if (returnValue.value) {
      value = this.evaluate(returnValue.value);
    }

    throw new Return(value);
  }

  public visitVariableStatement(variable: Statement.Variable): void {
    let value = null;

    if (variable.initializer !== null) {
      value = this.evaluate(variable.initializer);
    }

    this.environment.define(variable.name.lexeme, value);
  }

  public visitLoxWhileStatement(loxWhile: Statement.LoxWhile): void {
    while (isTruthy(this.evaluate(loxWhile.condition))) {
      this.execute(loxWhile.body);
    }
  }

  // --------------------EXPRESSION-------------------

  public visitAssignExpression(assign: Expression.Assign): Value {
    const value = this.evaluate(assign.value);
    const distance = this.locals.get(assign) as number;

    if (distance !== null && distance !== undefined) {
      this.environment.assignAt(distance, assign.name, value);
    } else {
      this.globals.assign(assign.name, value);
    }

    return value;
  }

  public visitBinaryExpression(binary: Expression.Binary): Value {
    const left = this.evaluate(binary.left);
    const right = this.evaluate(binary.right);

    switch (binary.operator.type) {
      case TokenEnum.MINUS:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left - right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.SLASH:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left / right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.STAR:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left * right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.PLUS: {
        const l = typeof left;
        const r = typeof right;
        if (l === "number" && r === "number") {
          return Number(left) + Number(right);
        }

        if (l === "string" && (r === "string" || r === "number")) {
          return String(left) + String(right);
        }

        if (l === "number" && r === "string") {
          throw new RuntimeError(binary.operator, errors.stringConcat);
        }

        throw new RuntimeError(binary.operator, errors.binaryOperands);
      }
      case TokenEnum.GREATER:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left > right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.GREATER_EQUAL:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left >= right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.LESS:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left < right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.LESS_EQUAL:
        if (isNumber(binary.operator, left) && isNumber(binary.operator, right)) {
          return left <= right;
        }

        break; // isNumber throws if falsy
      case TokenEnum.BANG_EQUAL:
        return !isEqual(left, right);
      case TokenEnum.EQUAL_EQUAL:
        return isEqual(left, right);
    }

    return null;
  }

  public visitCallExpression(call: Expression.Call): Value {
    const callee = this.evaluate(call.callee);

    const args = new Array<Value>();
    for (const arg of call.args) {
      args.push(this.evaluate(arg));
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(call.paren, errors.call);
    }

    const f: LoxCallable = callee;
    if (args.length !== f.arity) {
      throw new RuntimeError(call.paren, errors.expectedArguments(f.arity, args.length));
    }

    return f.call(this, args);
  }

  public visitGetExpression(get: Expression.Get): Value {
    const obj = this.evaluate(get.obj);

    if (obj instanceof LoxInstance) {
      return obj.get(get.name);
    }

    throw new RuntimeError(get.name, errors.instanceProperties);
  }

  public visitGroupingExpression(grouping: Expression.Grouping): Value {
    return this.evaluate(grouping.expression);
  }

  public visitLiteralExpression(literal: Expression.Literal): Value {
    return literal.value as Value;
  }

  public visitLogicalExpression(logical: Expression.Logical): Value {
    const left = this.evaluate(logical.left);

    if (logical.operator.type === TokenEnum.OR) {
      if (isTruthy(left)) {
        return left;
      }
    } else {
      if (!isTruthy(left)) {
        return left;
      }
    }

    return this.evaluate(logical.right);
  }

  public visitSetExpression(set: Expression.Set): Value {
    const obj = this.evaluate(set.obj);

    if (!(obj instanceof LoxInstance)) {
      throw new RuntimeError(set.name, errors.instanceFields);
    }

    const value = this.evaluate(set.value);
    obj.set(set.name, value);
    return value;
  }

  public visitLoxSuperExpression(loxSuper: Expression.LoxSuper): Value {
    const distance = this.locals.get(loxSuper) as number;
    const superclass = this.environment.getAt(distance, "super") as LoxClass;
    const obj = this.environment.getAt(distance - 1, "this");
    const method = superclass.findMethod(loxSuper.method.lexeme);

    if (method === null) {
      throw new RuntimeError(loxSuper.method, errors.undefinedProperty(loxSuper.method.lexeme));
    }

    return method.bind(obj as LoxInstance);
  }

  public visitLoxThisExpression(loxThis: Expression.LoxThis): Value {
    return this.lookUpVariable(loxThis.keyword, loxThis);
  }

  public visitUnaryExpression(unary: Expression.Unary): Value {
    const right = this.evaluate(unary.right);

    switch (unary.operator.type) {
      case TokenEnum.MINUS:
        if (isNumber(unary.operator, right)) {
          return (right * -10) / 10;
        }

        break; // isNumber throws if falsy
      case TokenEnum.BANG:
        return !isTruthy(right);
    }

    return null;
  }

  public visitVariableExpression(variable: Expression.Variable): Value {
    return this.lookUpVariable(variable.name, variable);
  }

  // ----------------------MISC.----------------------

  public resolve(expression: Expression.Expression, depth: number): void {
    this.locals.set(expression, depth);
  }

  public addStatement(statement: Statement.Statement) {
    this.statements.push(statement);
  }

  private lookUpVariable(name: Token, expression: Expression.Expression) {
    const distance = this.locals.get(expression);

    if (distance !== null && distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }

  private execute(statement: Statement.Statement) {
    statement.accept(this);
  }

  public executeBlock(statements: Statement.Statement[], environment: Environment): void {
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

  private evaluate(expression: Expression.Expression) {
    return expression.accept(this);
  }
}
