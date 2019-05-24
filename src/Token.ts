import { TokenType, TokenEnum } from "./types";

export class Token implements TokenType {
  private _type: TokenEnum;
  private _lexeme: string;
  private _literal: any;
  private _line: number;

  constructor(type: TokenEnum, lexeme: string, literal: any, line: number) {
    this._type = type;
    this._lexeme = lexeme;
    this._literal = literal;
    this._line = line;
  }

  get type() {
    return this._type;
  }

  get lexeme() {
    return this._lexeme;
  }

  get literal() {
    return this._literal;
  }

  get line() {
    return this._line;
  }

  public toString() {
    return `${this._type} ${this._lexeme} ${this._literal}`;
  }
}
