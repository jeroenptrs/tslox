// GENERATED FILE! DO NOT EDIT!
import { Token } from "./Token";

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default Expr;

export interface Visitor<R> {
  visitAssignExpr(assign: Assign): R;
  visitBinaryExpr(binary: Binary): R;
  visitCallExpr(call: Call): R;
  visitGetExpr(get: Get): R;
  visitGroupingExpr(grouping: Grouping): R;
  visitLiteralExpr(literal: Literal): R;
  visitLogicalExpr(logical: Logical): R;
  visitSetExpr(set: Set): R;
  visitSprExpr(spr: Spr): R;
  visitThsExpr(ths: Ths): R;
  visitUnaryExpr(unary: Unary): R;
  visitVariableExpr(variable: Variable): R;
}

export class Assign extends Expr {
  readonly name: Token;
  readonly value: Expr;

  constructor(name: Token, value: Expr) {
    super();
    this.name = name;
    this.value = value;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

export class Binary extends Expr {
  readonly left: Expr;
  readonly operator: Token;
  readonly right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class Call extends Expr {
  readonly callee: Expr;
  readonly paren: Token;
  readonly args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    super();
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitCallExpr(this);
  }
}

export class Get extends Expr {
  readonly obj: Expr;
  readonly name: Token;

  constructor(obj: Expr, name: Token) {
    super();
    this.obj = obj;
    this.name = name;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGetExpr(this);
  }
}

export class Grouping extends Expr {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class Literal extends Expr {
  readonly value: any;

  constructor(value: any) {
    super();
    this.value = value;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class Logical extends Expr {
  readonly left: Expr;
  readonly operator: Token;
  readonly right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
}

export class Set extends Expr {
  readonly obj: Expr;
  readonly name: Token;
  readonly value: Expr;

  constructor(obj: Expr, name: Token, value: Expr) {
    super();
    this.obj = obj;
    this.name = name;
    this.value = value;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSetExpr(this);
  }
}

export class Spr extends Expr {
  readonly keyword: Token;
  readonly method: Token;

  constructor(keyword: Token, method: Token) {
    super();
    this.keyword = keyword;
    this.method = method;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitSprExpr(this);
  }
}

export class Ths extends Expr {
  readonly keyword: Token;

  constructor(keyword: Token) {
    super();
    this.keyword = keyword;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitThsExpr(this);
  }
}

export class Unary extends Expr {
  readonly operator: Token;
  readonly right: Expr;

  constructor(operator: Token, right: Expr) {
    super();
    this.operator = operator;
    this.right = right;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

export class Variable extends Expr {
  readonly name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}
