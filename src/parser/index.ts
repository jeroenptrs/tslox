import ParseError from "ParseError";
import * as Expression from "../Expression";
import * as Statement from "../Statement";
import { TokenEnum } from "../enums";
import _scanner from "../scanner";
import type { ErrorFn, Token } from "../types";
import * as errors from "./errors";

export default function* parser(
  source: string,
  error: ErrorFn
): Generator<Statement.Statement, void, unknown> {
  const scanner = _scanner(source, error);
  const tokens: Token[] = [];
  let current = 0;
  let forFlag: string | undefined;

  function throwError(token: Token, message: string) {
    error(token, message);
    return new Error();
  }

  while (!isAtEnd()) {
    const dec = declaration();
    if (dec === null) {
      continue;
    }

    yield dec;
  }

  return;

  // -------------------DECLARATIONS------------------

  function declaration(): Statement.Statement | null {
    try {
      if (match(TokenEnum.CLASS)) {
        return classDeclaration();
      }

      if (match(TokenEnum.FUN)) {
        return funDeclaration("function");
      }

      if (match(TokenEnum.VAR)) {
        return varDeclaration();
      }

      return statement();
    } catch (error) {
      if (error instanceof ParseError && error.tokens) {
        throw error;
      } else if (error instanceof ParseError) {
        throw new ParseError(error.message, error.line, error.lexeme, tokens);
      }

      synchronize();
      return null;
    }
  }

  function classDeclaration() {
    const name = consume(TokenEnum.IDENTIFIER, errors.className);
    let superclass: Expression.Variable | null = null;

    if (match(TokenEnum.LESS)) {
      consume(TokenEnum.IDENTIFIER, errors.classSuperName);
      superclass = new Expression.Variable(previous());
    }

    consume(TokenEnum.LEFT_BRACE, errors.classLeftBrace);

    const methods = new Array<Statement.Fun>();
    while (!check(TokenEnum.RIGHT_BRACE) && !isAtEnd()) {
      methods.push(funDeclaration("method"));
    }

    consume(TokenEnum.RIGHT_BRACE, errors.classRightBrace);

    return new Statement.LoxClass(name, superclass, methods);
  }

  function funDeclaration(kind: "method" | "function") {
    const name = consume(TokenEnum.IDENTIFIER, errors.funName(kind));

    consume(TokenEnum.LEFT_PAREN, errors.funLeftParen(kind));
    const params = new Array<Token>();
    if (!check(TokenEnum.RIGHT_PAREN)) {
      do {
        if (params.length >= 8) {
          throw error(peek(), errors.funMax);
        }

        params.push(consume(TokenEnum.IDENTIFIER, errors.funParamName));
      } while (match(TokenEnum.COMMA));
    }
    consume(TokenEnum.RIGHT_PAREN, errors.funParamRightParen);

    consume(TokenEnum.LEFT_BRACE, errors.funParamLeftBrace);
    const funBody = block();

    return new Statement.Fun(name, params, funBody);
  }

  function varDeclaration() {
    const name = consume(TokenEnum.IDENTIFIER, errors.varName);

    let initializer: Expression.Expression | null = null;

    if (match(TokenEnum.EQUAL)) {
      initializer = expression();
    }

    consume(TokenEnum.SEMICOLON, errors.varSemi);
    return new Statement.Variable(name, initializer);
  }

  // --------------------STATEMENT--------------------

  function statement(): Statement.Statement {
    if (match(TokenEnum.FOR)) {
      return forStatement();
    }

    if (match(TokenEnum.IF)) {
      return ifElseStatement();
    }

    if (match(TokenEnum.PRINT)) {
      return printStatement();
    }

    if (match(TokenEnum.RETURN)) {
      return returnStatement();
    }

    if (match(TokenEnum.WHILE)) {
      return whileStatement();
    }

    if (match(TokenEnum.LEFT_BRACE)) {
      return new Statement.Block(block());
    }

    return expressionStatement();
  }

  function forStatement(): Statement.Statement {
    consume(TokenEnum.LEFT_PAREN, errors.forLeftParen);

    forFlag = "initializer";
    let initializer: Statement.Statement | null;
    if (match(TokenEnum.SEMICOLON)) {
      initializer = null;
    } else if (match(TokenEnum.VAR)) {
      initializer = varDeclaration();
    } else {
      initializer = expressionStatement();
    }

    forFlag = "condition";
    let condition: Expression.Expression | null = !check(TokenEnum.SEMICOLON) ? expression() : null;
    consume(TokenEnum.SEMICOLON, errors.forSemi);

    forFlag = "increment";
    const increment: Expression.Expression | null = !check(TokenEnum.RIGHT_PAREN)
      ? expression()
      : null;
    consume(TokenEnum.RIGHT_PAREN, errors.forRightParen);
    forFlag = undefined;

    let body = statement();
    if (increment !== null) {
      body = new Statement.Block([body, new Statement.Expression(increment)]);
    }

    if (condition === null) {
      condition = new Expression.Literal(true);
    }

    body = new Statement.LoxWhile(condition, body);

    if (initializer !== null) {
      body = new Statement.Block([initializer, body]);
    }

    return body;
  }

  function ifElseStatement(): Statement.Statement {
    consume(TokenEnum.LEFT_PAREN, errors.ifLeftParen);
    const condition = expression();
    consume(TokenEnum.RIGHT_PAREN, errors.ifRightParen);

    const thenBranch = statement();
    let elseBranch = null;
    if (match(TokenEnum.ELSE)) {
      elseBranch = statement();
    }

    return new Statement.IfElse(condition, thenBranch, elseBranch);
  }

  function printStatement(): Statement.Statement {
    const value = expression();
    consume(TokenEnum.SEMICOLON, errors.printSemi);
    return new Statement.Print(value);
  }

  function returnStatement(): Statement.Statement {
    const keyword = previous();
    let value = null;

    if (!check(TokenEnum.SEMICOLON)) {
      value = expression();
    }

    consume(TokenEnum.SEMICOLON, errors.returnSemi);
    return new Statement.ReturnValue(keyword, value);
  }

  function whileStatement(): Statement.Statement {
    consume(TokenEnum.LEFT_PAREN, errors.whileLeftParen);
    const condition = expression();
    consume(TokenEnum.RIGHT_PAREN, errors.whileRightParen);
    const body = statement();

    return new Statement.LoxWhile(condition, body);
  }

  function expressionStatement(): Statement.Statement {
    const expr = expression();
    consume(TokenEnum.SEMICOLON, errors.exprStmtSemi);
    return new Statement.Expression(expr);
  }

  function block(): Statement.Statement[] {
    const statements = new Array<Statement.Statement>();

    while (!check(TokenEnum.RIGHT_BRACE) && !isAtEnd()) {
      const dec = declaration();
      if (dec !== null) {
        statements.push(dec);
      }
    }

    consume(TokenEnum.RIGHT_BRACE, errors.blockRightBrace);
    return statements;
  }

  // --------------------EXPRESSION-------------------

  function expression(): Expression.Expression {
    return assignment();
  }

  function assignment(): Expression.Expression {
    const expr = or();

    if (match(TokenEnum.EQUAL)) {
      const equals = previous();
      const value = assignment();

      if (expr instanceof Expression.Variable) {
        const { name } = expr;
        return new Expression.Assign(name, value);
      } else if (expr instanceof Expression.Get) {
        const { obj, name } = expr;
        return new Expression.Set(obj, name, value);
      }

      throw error(equals, errors.assignInvalid);
    }

    return expr;
  }

  function or(): Expression.Expression {
    let expr = and();

    while (match(TokenEnum.OR)) {
      const operator = previous();
      const right = and();
      expr = new Expression.Logical(expr, operator, right);
    }

    return expr;
  }

  function and(): Expression.Expression {
    let expr = equality();

    while (match(TokenEnum.AND)) {
      const operator = previous();
      const right = equality();
      expr = new Expression.Logical(expr, operator, right);
    }

    return expr;
  }

  function equality(): Expression.Expression {
    let expr = comparison();

    while (match(TokenEnum.BANG_EQUAL, TokenEnum.EQUAL_EQUAL)) {
      const operator = previous();
      const right = comparison();
      expr = new Expression.Binary(expr, operator, right);
    }

    return expr;
  }

  function comparison(): Expression.Expression {
    let expr = addition();

    while (
      match(TokenEnum.GREATER, TokenEnum.GREATER_EQUAL, TokenEnum.LESS, TokenEnum.LESS_EQUAL)
    ) {
      const operator = previous();
      const right = addition();
      expr = new Expression.Binary(expr, operator, right);
    }

    return expr;
  }

  function addition(): Expression.Expression {
    let expr = multiplication();

    while (match(TokenEnum.MINUS, TokenEnum.PLUS)) {
      const operator = previous();
      const right = multiplication();
      expr = new Expression.Binary(expr, operator, right);
    }

    return expr;
  }

  function multiplication(): Expression.Expression {
    let expr = unary();

    while (match(TokenEnum.SLASH, TokenEnum.STAR)) {
      const operator = previous();
      const right = unary();
      expr = new Expression.Binary(expr, operator, right);
    }

    return expr;
  }

  function unary(): Expression.Expression {
    if (match(TokenEnum.BANG, TokenEnum.MINUS)) {
      const operator = previous();
      const right = unary();
      return new Expression.Unary(operator, right);
    }

    return call();
  }

  function call(): Expression.Expression {
    let expr = primary();
    const alwaysTrue = true;

    while (alwaysTrue) {
      if (match(TokenEnum.LEFT_PAREN)) {
        expr = finishCall(expr);
      } else if (match(TokenEnum.DOT)) {
        const name = consume(TokenEnum.IDENTIFIER, errors.callExpect);
        expr = new Expression.Get(expr, name);
      } else {
        break;
      }
    }

    return expr;
  }

  function primary(): Expression.Expression {
    if (match(TokenEnum.FALSE)) {
      return new Expression.Literal(false);
    }

    if (match(TokenEnum.TRUE)) {
      return new Expression.Literal(true);
    }

    if (match(TokenEnum.NIL)) {
      return new Expression.Literal(null);
    }

    if (match(TokenEnum.NUMBER, TokenEnum.STRING)) {
      return new Expression.Literal(previous().literal);
    }

    if (match(TokenEnum.SUPER)) {
      const keyword = previous();
      consume(TokenEnum.DOT, errors.primarySuper);
      const method = consume(TokenEnum.IDENTIFIER, errors.primarySuperClass);
      return new Expression.LoxSuper(keyword, method);
    }

    if (match(TokenEnum.THIS)) {
      return new Expression.LoxThis(previous());
    }

    if (match(TokenEnum.IDENTIFIER)) {
      const identifier = previous();
      if (forFlag) {
        identifier.flag = forFlag;
      }
      return new Expression.Variable(identifier);
    }

    if (match(TokenEnum.LEFT_PAREN)) {
      const expr = expression();
      consume(TokenEnum.RIGHT_PAREN, errors.primaryRightParen);
      return new Expression.Grouping(expr);
    }

    throw error(peek(), errors.primaryExpect);
  }

  function finishCall(callee: Expression.Expression) {
    const args = new Array<Expression.Expression>();

    if (!check(TokenEnum.RIGHT_PAREN)) {
      do {
        if (args.length >= 8) {
          throw error(peek(), errors.callMax);
        }
        args.push(expression());
      } while (match(TokenEnum.COMMA));
    }

    const paren = consume(TokenEnum.RIGHT_PAREN, errors.callRightParen);

    return new Expression.Call(callee, paren, args);
  }

  // --------------------ITERABLES--------------------

  function peek(): Token {
    let token: Token;

    if (tokens.length - 1 >= current) {
      token = tokens[current] as Token;
    } else {
      const { value: nextToken } = scanner.next();
      token = nextToken;
      tokens.push(nextToken);
    }

    return token;
  }

  function isAtEnd(): boolean {
    return peek().type === TokenEnum.EOF;
  }

  function check(type: TokenEnum): boolean {
    return isAtEnd() ? false : peek().type === type;
  }

  function previous(): Token {
    return tokens[current - 1] as Token;
  }

  function advance(): Token {
    if (!isAtEnd()) {
      current++;
    }

    return previous();
  }

  function match(...types: TokenEnum[]): boolean {
    for (const type of types) {
      if (check(type)) {
        advance();
        return true;
      }
    }

    return false;
  }

  function synchronize(): void {
    advance();

    while (!isAtEnd()) {
      if (previous().type === TokenEnum.SEMICOLON) {
        return;
      }

      peek();
      advance();
    }
  }

  function consume(type: TokenEnum, message: string): Token {
    if (!check(type)) {
      throw throwError(peek(), message);
    }

    return advance();
  }
}
