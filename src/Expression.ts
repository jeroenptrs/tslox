// GENERATED FILE! DO NOT EDIT!
import type { Token, Literal as TLiteral } from "./types";

export abstract class Expression {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default Expression;

export interface Visitor<R> {
  visitAssignExpression(assign: Assign): R;
  visitBinaryExpression(binary: Binary): R;
  visitCallExpression(call: Call): R;
  visitGetExpression(get: Get): R;
  visitGroupingExpression(grouping: Grouping): R;
  visitLiteralExpression(literal: Literal): R;
  visitLogicalExpression(logical: Logical): R;
  visitSetExpression(set: Set): R;
  visitLoxSuperExpression(loxSuper: LoxSuper): R;
  visitLoxThisExpression(loxThis: LoxThis): R;
  visitUnaryExpression(unary: Unary): R;
  visitVariableExpression(variable: Variable): R;
}

export class Assign extends Expression {
  constructor(
    readonly name: Token,
    readonly value: Expression
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitAssignExpression(this);
  }
}

export class Binary extends Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpression(this);
  }
}

export class Call extends Expression {
  constructor(
    readonly callee: Expression,
    readonly paren: Token,
    readonly args: Expression[]
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitCallExpression(this);
  }
}

export class Get extends Expression {
  constructor(
    readonly obj: Expression,
    readonly name: Token
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGetExpression(this);
  }
}

export class Grouping extends Expression {
  constructor(readonly expression: Expression) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpression(this);
  }
}

export class Literal extends Expression {
  constructor(readonly value: TLiteral) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}

export class Logical extends Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLogicalExpression(this);
  }
}

export class Set extends Expression {
  constructor(
    readonly obj: Expression,
    readonly name: Token,
    readonly value: Expression
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSetExpression(this);
  }
}

export class LoxSuper extends Expression {
  constructor(
    readonly keyword: Token,
    readonly method: Token
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLoxSuperExpression(this);
  }
}

export class LoxThis extends Expression {
  constructor(readonly keyword: Token) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLoxThisExpression(this);
  }
}

export class Unary extends Expression {
  constructor(
    readonly operator: Token,
    readonly right: Expression
  ) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpression(this);
  }
}

export class Variable extends Expression {
  constructor(readonly name: Token) {
    super();
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVariableExpression(this);
  }
}
