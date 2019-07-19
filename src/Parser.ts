import * as Expr from "./Expr";
import * as Stmt from "./Stmt";
import { Token } from "./Token";
import { LogError, TokenEnum } from "./types";

class ParseError extends Error {}

export class Parser {
  private errorLogger: LogError;
  private readonly tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[], errorLogger: LogError) {
    this.tokens = tokens;
    this.errorLogger = errorLogger;
  }

  public parse(): Stmt.Stmt[] {
    const statements = new Array<Stmt.Stmt>();

    while (!this.isAtEnd()) {
      const d = this.declaration();
      if (d !== null) statements.push(d);
    }

    return statements;
  }

  private expression(): Expr.Expr {
    return this.assignment();
  }

  private declaration(): Stmt.Stmt | null {
    try {
      if (this.match(TokenEnum.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }

  private statement(): Stmt.Stmt {
    if (this.match(TokenEnum.PRINT)) return this.printStatement();
    return this.expressionStatement();
  }

  private printStatement(): Stmt.Stmt {
    const value = this.expression();
    this.consume(TokenEnum.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }

  private varDeclaration() {
    const name: Token = this.consume(TokenEnum.IDENTIFIER, "Expect variable name");
    let initializer: Expr.Expr | null = null;

    if (this.match(TokenEnum.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenEnum.SEMICOLON, "Expect ';' after variable declaration.");
    return new Stmt.Vrbl(name, initializer);
  }

  private expressionStatement(): Stmt.Stmt {
    const expr = this.expression();
    this.consume(TokenEnum.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Expression(expr);
  }

  private assignment(): Expr.Expr {
    const expr = this.equality();

    if (this.match(TokenEnum.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Expr.Variable) {
        const name = expr.name;
        return new Expr.Assign(name, value);
      }

      this.error(equals, "Invalid assignment target");
    }

    return expr;
  }

  private equality(): Expr.Expr {
    let expr: Expr.Expr = this.comparison();

    while (this.match(TokenEnum.BANG_EQUAL, TokenEnum.EQUAL_EQUAL)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.comparison();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr.Expr {
    let expr: Expr.Expr = this.addition();

    while (
      this.match(TokenEnum.GREATER, TokenEnum.GREATER_EQUAL, TokenEnum.LESS, TokenEnum.LESS_EQUAL)
    ) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.addition();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private addition(): Expr.Expr {
    let expr: Expr.Expr = this.multiplication();

    while (this.match(TokenEnum.MINUS, TokenEnum.PLUS)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.multiplication();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private multiplication(): Expr.Expr {
    let expr: Expr.Expr = this.unary();

    while (this.match(TokenEnum.SLASH, TokenEnum.STAR)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.unary();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr.Expr {
    if (this.match(TokenEnum.BANG, TokenEnum.MINUS)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.unary();
      return new Expr.Unary(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr.Expr {
    if (this.match(TokenEnum.FALSE)) return new Expr.Literal(false);
    if (this.match(TokenEnum.TRUE)) return new Expr.Literal(true);
    if (this.match(TokenEnum.NIL)) return new Expr.Literal(null);

    if (this.match(TokenEnum.NUMBER, TokenEnum.STRING)) {
      return new Expr.Literal(this.previous().literal);
    }

    if (this.match(TokenEnum.IDENTIFIER)) {
      return new Expr.Variable(this.previous());
    }

    if (this.match(TokenEnum.LEFT_PAREN)) {
      const expr: Expr.Expr = this.expression();
      this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private match(...types: TokenEnum[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private consume = (type: TokenEnum, message: string) => {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  };

  private error(token: Token, message: string) {
    this.errorLogger(token, message);
    return new ParseError();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenEnum.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenEnum.CLASS:
        case TokenEnum.FUN:
        case TokenEnum.VAR:
        case TokenEnum.FOR:
        case TokenEnum.IF:
        case TokenEnum.WHILE:
        case TokenEnum.PRINT:
        case TokenEnum.RETURN:
          return;
      }

      this.advance();
    }
  }

  private check = (type: TokenEnum) => (this.isAtEnd() ? false : this.peek().type === type);

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd = () => this.peek().type === TokenEnum.EOF;

  private peek = () => this.tokens[this.current];

  private previous = () => this.tokens[this.current - 1];
}
