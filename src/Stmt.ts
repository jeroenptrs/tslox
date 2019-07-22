// GENERATED FILE! DO NOT EDIT!
import { Expr } from "./Expr";
import { Token } from "./Token";

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default Stmt;

export interface Visitor<R> {
  visitBlockStmt(block: Block): R;
  visitExpressionStmt(expression: Expression): R;
  visitIfElseStmt(ifelse: IfElse): R;
  visitPrintStmt(print: Print): R;
  visitVrblStmt(vrbl: Vrbl): R;
  visitWhleStmt(whle: Whle): R;
}

export class Block extends Stmt {
  readonly statements: Stmt[];

  constructor(statements: Stmt[]) {
    super();
    this.statements = statements;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
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

export class IfElse extends Stmt {
  readonly condition: Expr;
  readonly thenBranch: Stmt;
  readonly elseBranch: Stmt | null;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIfElseStmt(this);
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

export class Whle extends Stmt {
  readonly condition: Expr;
  readonly body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    super();
    this.condition = condition;
    this.body = body;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitWhleStmt(this);
  }
}
