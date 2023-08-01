import { TokenType, TokenEnum } from "./types";

export class Token implements TokenType {
  readonly type: TokenEnum;
  readonly lexeme: string;
  readonly literal: unknown;
  readonly line: number;
  public flag?: string = undefined;

  constructor(type: TokenEnum, lexeme: string, literal: unknown, line: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  public toString() {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
