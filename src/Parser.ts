import { Token } from "./Token";
import * as Expr from "./Expr";
import { TokenEnum, TokenType } from "./types";
import { error } from "./helpers/error";

class ParseError extends Error {}

export class Parser {
  private readonly tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): Expr.Expr {
    try {
      return this.expression();
    } catch (error) {
      return null;
    }
  }

  private expression(): Expr.Expr {
    return this.equality();
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

    if (this.match(TokenEnum.LEFT_PAREN)) {
      const expr: Expr.Expr = this.expression();
      this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw error(this.peek(), "Expect expression.");
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
    error(token, message);
    return new ParseError();
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenEnum.SEMICOLON) return;

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
