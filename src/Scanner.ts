import { Token } from "./Token";
import { TokenEnum, LogError } from "./types";
import { isDigit } from "./helpers/Digit";
import { isAlpha } from "./helpers/Alpha";
import { isAlphaNumeric } from "./helpers/AlphaNumeric";
import { Keywords } from "./helpers/Keywords";

export class Scanner {
  private errorLogger: LogError;
  private source: string;
  private tokens: Token[] = [];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;

  constructor(source: string, errorLogger: LogError) {
    this.source = source;
    this.errorLogger = errorLogger;
  }

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenEnum.EOF, "", null, this.line));
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenEnum.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenEnum.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenEnum.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenEnum.RIGHT_BRACE);
        break;

      case ",":
        this.addToken(TokenEnum.COMMA);
        break;
      case ".":
        this.addToken(TokenEnum.DOT);
        break;
      case "-":
        this.addToken(TokenEnum.MINUS);
        break;
      case "+":
        this.addToken(TokenEnum.PLUS);
        break;
      case ";":
        this.addToken(TokenEnum.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenEnum.STAR);
        break;

      case "!":
        this.addToken(this.match("=") ? TokenEnum.BANG_EQUAL : TokenEnum.BANG);
        break;
      case "=":
        this.addToken(this.match("=") ? TokenEnum.EQUAL_EQUAL : TokenEnum.EQUAL);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenEnum.LESS_EQUAL : TokenEnum.LESS);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenEnum.GREATER_EQUAL : TokenEnum.GREATER);
        break;

      case "/":
        if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else this.addToken(TokenEnum.SLASH);
        break;

      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line++;
        break;

      case '"':
        this.string();
        break;

      default:
        if (isDigit(c)) this.number();
        else if (isAlpha(c)) this.identifier();
        else this.errorLogger(this.line, "Unexpected character.");
        break;
    }
  }

  private identifier() {
    while (isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    const type = Keywords[text];

    this.addToken(type === null ? TokenEnum.IDENTIFIER : type);
  }

  private number(): void {
    let decimal: boolean = false;

    const advanceIfDigit = () => {
      while (isDigit(this.peek())) {
        this.advance();
      }
    };

    advanceIfDigit();

    if (this.peek() === "." && isDigit(this.peekNext())) {
      decimal = true;
      this.advance();
      advanceIfDigit();
    }

    const number = this.source.substring(this.start, this.current);
    this.createAndAddToken(TokenEnum.NUMBER, decimal ? parseFloat(number) : parseInt(number));
  }

  private string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errorLogger(this.line, "Unterminated string.");
      return;
    }

    this.advance();

    const value: string = this.source.substring(this.start + 1, this.current - 1);
    this.createAndAddToken(TokenEnum.STRING, value);
  }

  private match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    this.current++;
    return this.source.charAt(this.current - 1);
  }

  private addToken(type: TokenEnum): void {
    this.createAndAddToken(type, null);
  }

  private createAndAddToken(type: TokenEnum, literal: any): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }
}
