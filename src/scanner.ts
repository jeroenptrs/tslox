// This is a modification of lydell/js-tokens to fit the Lox Language.

import { TokenEnum } from "./enums";
import { identifierKeywords } from "./mapping";
import type { ErrorFn, Token } from "./types";

const Punctuation = /-{1}|\+{1}|\.|\*|(?:>|<|=|!)=?|\/(?![/*])|[,;(){}]/y;
const Identifier =
  /(\x23?)(?=[$_\p{ID_Start}\\])(?:[$_\u200C\u200D\p{ID_Continue}]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+/uy;
const StringLiteral = /(")(?:(?!\1)[^\\\n\r]|\\(?:[^]))*(\1)?/y;
// const StringLiteral = /(")(?:(?!\1)[^\\\n\r]|\\(?:\r\n|[^]))*(\1)?/y; // Do if multiline string.
const NumericLiteral =
  /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*)n?|0n|[1-9](?:_?\d)*n|(?:(?:0(?!\d)|0\d*[89]\d*|[1-9](?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|0[0-7]+/y;
const WhiteSpace = /[\t\v\f\ufeff\p{Zs}]+/uy;
const LineTerminator = /\r?\n|[\r\u2028\u2029]/y;
const MultiLineComment = /\/\*(?:[^*]|\*(?!\/))*(\*\/)?/y;
const SingleLineComment = /\/\/.*/y;
const NewLine = /\r?\n|[\r\u2028\u2029]/g;

export default function* scanner(source: string, error: ErrorFn): Generator<Token, void, unknown> {
  const { length } = source;
  let start = 0;
  let current = 0;
  let currentToken = "";
  let line = 1;
  let match: RegExpExecArray | null;

  while (current < length) {
    start = current;

    // 1. Start with Punctuation
    Punctuation.lastIndex = current;
    if ((match = Punctuation.exec(source))) {
      current = Punctuation.lastIndex;

      const punctuation = match[0];
      yield {
        type: punctuation as TokenEnum,
        literal: undefined,
        lexeme: punctuation,
        line,
      };
      continue;
    }

    // 2. Identifiers next
    Identifier.lastIndex = current;
    if ((match = Identifier.exec(source))) {
      current = Identifier.lastIndex;

      const text = match[0];
      yield {
        type: identifierKeywords[text] ?? TokenEnum.IDENTIFIER,
        literal: undefined,
        lexeme: text,
        line,
      };
      continue;
    }

    // 3. Literals follows
    // 3.a. String Literal
    StringLiteral.lastIndex = current;
    if ((match = StringLiteral.exec(source))) {
      current = StringLiteral.lastIndex;
      const unterminatedString = current >= length;
      if (unterminatedString) error(line, "Unterminated string.");

      const rawString = match[0];
      const value = rawString.substring(1, unterminatedString ? current : rawString.length - 1);
      yield { type: TokenEnum.STRING, literal: value, lexeme: `"${value}"`, line };
      continue;
    }

    // 3.b. Numeric Literal
    NumericLiteral.lastIndex = current;
    if ((match = NumericLiteral.exec(source))) {
      current = NumericLiteral.lastIndex;

      const number = match[0];
      const isDecimal = number.includes(".");
      yield {
        type: TokenEnum.NUMBER,
        literal: isDecimal ? parseFloat(number) : parseInt(number),
        lexeme: number,
        line,
      };
      continue;
    }

    // 4. Finally non-token-creation actions
    // 4.a. Whitespace
    WhiteSpace.lastIndex = current;
    if (WhiteSpace.exec(source)) {
      current = WhiteSpace.lastIndex;
      continue;
    }

    // 4.b. Newlines
    LineTerminator.lastIndex = current;
    if (LineTerminator.exec(source)) {
      current = LineTerminator.lastIndex;
      line++;
      continue;
    }

    // 4.c. Comments
    // 4.c.a. Multi-line Comments
    MultiLineComment.lastIndex = current;
    if ((match = MultiLineComment.exec(source))) {
      current = MultiLineComment.lastIndex;
      line += (match[0].match(NewLine) ?? []).length;
      continue;
    }

    // 4.c.b. Single-line Comments
    SingleLineComment.lastIndex = current;
    if (SingleLineComment.exec(source)) {
      current = SingleLineComment.lastIndex;
      continue;
    }

    // 5. Handle unexpected tokens
    currentToken = String.fromCodePoint(source.codePointAt(current) ?? start);
    current += currentToken.length;
    error(line, `Unexpected token: ${currentToken}`);
  }

  yield { type: TokenEnum.EOF, literal: undefined, lexeme: "", line };
}
