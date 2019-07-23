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
      if (this.match(TokenEnum.FUN)) return this.fun("function");
      if (this.match(TokenEnum.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }

  private statement(): Stmt.Stmt {
    if (this.match(TokenEnum.FOR)) return this.forStatement();
    if (this.match(TokenEnum.IF)) return this.ifElseStatement();
    if (this.match(TokenEnum.PRINT)) return this.printStatement();
    if (this.match(TokenEnum.RETURN)) return this.returnStatement();
    if (this.match(TokenEnum.WHILE)) return this.whileStatement();
    if (this.match(TokenEnum.LEFT_BRACE)) return new Stmt.Block(this.block());
    return this.expressionStatement();
  }

  private forStatement(): Stmt.Stmt {
    this.consume(TokenEnum.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Stmt.Stmt | null;
    if (this.match(TokenEnum.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TokenEnum.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr.Expr | null = !this.check(TokenEnum.SEMICOLON) ? this.expression() : null;
    this.consume(TokenEnum.SEMICOLON, "Expect ';' after loop condition.");

    const increment: Expr.Expr | null = !this.check(TokenEnum.RIGHT_PAREN)
      ? this.expression()
      : null;
    this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after for clauses.");

    let body = this.statement();
    if (increment !== null) body = new Stmt.Block([body, new Stmt.Expression(increment)]);
    if (condition === null) condition = new Expr.Literal(true);

    body = new Stmt.Whle(condition, body);

    if (initializer !== null) body = new Stmt.Block([initializer, body]);

    return body;
  }

  private ifElseStatement(): Stmt.Stmt {
    this.consume(TokenEnum.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after if condition.");

    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenEnum.ELSE)) {
      elseBranch = this.statement();
    }

    return new Stmt.IfElse(condition, thenBranch, elseBranch);
  }

  private printStatement(): Stmt.Stmt {
    const value = this.expression();
    this.consume(TokenEnum.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Print(value);
  }

  private returnStatement(): Stmt.Stmt {
    const keyword = this.previous();
    let value = null;

    if (!this.check(TokenEnum.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenEnum.SEMICOLON, "Expect ';' after a return value");
    return new Stmt.ReturnValue(keyword, value);
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

  private whileStatement(): Stmt.Stmt {
    this.consume(TokenEnum.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after condition.");
    const body = this.statement();

    return new Stmt.Whle(condition, body);
  }

  private expressionStatement(): Stmt.Stmt {
    const expr = this.expression();
    this.consume(TokenEnum.SEMICOLON, "Expect ';' after value.");
    return new Stmt.Expression(expr);
  }

  private fun(kind: string): Stmt.Fun {
    const name = this.consume(TokenEnum.IDENTIFIER, `Expected ${kind} name.`);

    this.consume(TokenEnum.LEFT_PAREN, `Expected '(' after ${kind} name.`);
    const params = new Array<Token>();
    if (!this.check(TokenEnum.RIGHT_PAREN)) {
      do {
        if (params.length >= 8) {
          throw this.error(this.peek(), "Cannot have more than 8 parameters.");
        }

        params.push(this.consume(TokenEnum.IDENTIFIER, "Expect parameter name."));
      } while (this.match(TokenEnum.COMMA));
    }
    this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TokenEnum.LEFT_BRACE, "Expect '{' after parameters.");
    const funBody = this.block();

    return new Stmt.Fun(name, params, funBody);
  }

  private block(): Stmt.Stmt[] {
    const statements = new Array<Stmt.Stmt>();

    while (!this.check(TokenEnum.RIGHT_BRACE) && !this.isAtEnd()) {
      const d = this.declaration();
      if (d !== null) statements.push(d);
    }

    this.consume(TokenEnum.RIGHT_BRACE, "Expect } after block");
    return statements;
  }

  private assignment(): Expr.Expr {
    const expr = this.or();

    if (this.match(TokenEnum.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof Expr.Variable) {
        const name = expr.name;
        return new Expr.Assign(name, value);
      }

      throw this.error(equals, "Invalid assignment target");
    }

    return expr;
  }

  private or(): Expr.Expr {
    let expr = this.and();

    while (this.match(TokenEnum.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr.Expr {
    let expr = this.equality();

    while (this.match(TokenEnum.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Expr.Logical(expr, operator, right);
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

    return this.call();
  }

  private call(): Expr.Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenEnum.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
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

  private finishCall(callee: Expr.Expr) {
    const args = new Array<Expr.Expr>();

    if (!this.check(TokenEnum.RIGHT_PAREN)) {
      do {
        if (args.length >= 8) {
          throw this.error(this.peek(), "Cannot have more than 8 arguments");
        }
        args.push(this.expression());
      } while (this.match(TokenEnum.COMMA));
    }

    const paren = this.consume(TokenEnum.RIGHT_PAREN, "Expect ')' after arguments.");

    return new Expr.Call(callee, paren, args);
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
