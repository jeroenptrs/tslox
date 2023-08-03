// GENERATED FILE! DO NOT EDIT!
import * as Expr from "./Expression";
import { Token } from "./types";

export abstract class Statement {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default Statement;

export interface Visitor<R> {
  visitBlockStatement(block: Block): R;
  visitLoxClassStatement(loxClass: LoxClass): R;
  visitExpressionStatement(expression: Expression): R;
  visitFunStatement(fun: Fun): R;
  visitIfElseStatement(ifElse: IfElse): R;
  visitPrintStatement(print: Print): R;
  visitReturnValueStatement(returnValue: ReturnValue): R;
  visitVariableStatement(variable: Variable): R;
  visitLoxWhileStatement(loxWhile: LoxWhile): R;
}

export class Block extends Statement {
  constructor(readonly statements: Statement[]) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBlockStatement(this);
  }
}

export class LoxClass extends Statement {
  constructor(
    readonly name: Token,
    readonly superclass: Expr.Variable | null,
    readonly methods: Fun[]
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLoxClassStatement(this);
  }
}

export class Expression extends Statement {
  constructor(readonly expr: Expr.Expression) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStatement(this);
  }
}

export class Fun extends Statement {
  constructor(
    readonly name: Token,
    readonly params: Token[],
    readonly funBody: Statement[]
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitFunStatement(this);
  }
}

export class IfElse extends Statement {
  constructor(
    readonly condition: Expr.Expression,
    readonly thenBranch: Statement,
    readonly elseBranch: Statement | null
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitIfElseStatement(this);
  }
}

export class Print extends Statement {
  constructor(readonly expr: Expr.Expression) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrintStatement(this);
  }
}

export class ReturnValue extends Statement {
  constructor(
    readonly keyword: Token,
    readonly value: Expr.Expression | null
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitReturnValueStatement(this);
  }
}

export class Variable extends Statement {
  constructor(
    readonly name: Token,
    readonly initializer: Expr.Expression | null
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVariableStatement(this);
  }
}

export class LoxWhile extends Statement {
  constructor(
    readonly condition: Expr.Expression,
    readonly body: Statement
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLoxWhileStatement(this);
  }
}
