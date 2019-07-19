// GENERATED FILE! DO NOT EDIT!
import { Expr } from "./Expr";
import { Token } from "./Token";

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default Stmt;

export interface Visitor<R> {
  visitExpressionStmt(expression: Expression): R;
  visitPrintStmt(print: Print): R;
  visitVrblStmt(vrbl: Vrbl): R;
}

export class Expression extends Stmt {
  readonly expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Print extends Stmt {
  readonly expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class Vrbl extends Stmt {
  readonly name: Token;
  readonly initializer: Expr | null;

  constructor(name: Token, initializer: Expr | null) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVrblStmt(this);
  }
}
