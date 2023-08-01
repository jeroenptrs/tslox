import { TokenEnum } from "./enums";
import { identifierKeywords, punctuationKeywords } from "./mapping";
import {
  testIdentifier,
  testNewLine,
  testNumericLiteral,
  testPunctuation,
  testSingleLineComment,
  testStringLiteral,
  testWhiteSpace,
} from "./scannerTests";
import type { ErrorFn, Literal, Token } from "./types";

export default function* scanner(source: string, error: ErrorFn) {
  const { length } = source;
  let start = 0;
  let current = 0;
  let currentToken = "";
  let line = 1;

  const createToken = (type: TokenEnum, literal: Literal): Token => {
    return {
      type,
      lexeme: source.substring(start, current),
      literal,
      line,
    };
  };

  while (current < length) {
    start = current;

    // 1. Start with Punctuation
    const punctuationMatch = testPunctuation(source, current);
    if (punctuationMatch) {
      current = punctuationMatch.index;
      const punctuation = source.substring(start, current);
      const type = punctuationKeywords[punctuation] as TokenEnum;
      yield createToken(type, punctuation);
      continue;
    }

    // 2. Identifiers next
    const identifierMatch = testIdentifier(source, current);
    if (identifierMatch) {
      current = identifierMatch.index;
      const text = source.substring(start, current);
      yield createToken(identifierKeywords[text] ?? TokenEnum.IDENTIFIER, undefined);
      continue;
    }

    // 3. Literals follows
    // 3.a. String Literal
    const stringLiteralMatch = testStringLiteral(source, current);
    if (stringLiteralMatch) {
      current = stringLiteralMatch.index;
      const unterminatedString = current >= length;
      const value = source.substring(start + 1, unterminatedString ? current : current - 1);
      yield createToken(TokenEnum.STRING, value);
      if (unterminatedString) error(line, "Unterminated string.");
      continue;
    }

    // 3.b. Numeric Literal
    const numericLiteralMatch = testNumericLiteral(source, current);
    if (numericLiteralMatch) {
      current = numericLiteralMatch.index;
      const number = source.substring(start, current);
      const isDecimal = number.includes(".");
      yield createToken(TokenEnum.NUMBER, isDecimal ? parseFloat(number) : parseInt(number));
      continue;
    }

    // 4. Finally non-token-creation actions
    // 4.a. Whitespace
    const whiteSpaceMatch = testWhiteSpace(source, current);
    if (whiteSpaceMatch) {
      current = whiteSpaceMatch.index;
      continue;
    }

    // 4.b. Newlines
    const newLineMatch = testNewLine(source, current);
    if (newLineMatch) {
      current = newLineMatch.index;
      line++;
      continue;
    }

    // 4.c. Comments
    const singleLineCommentMatch = testSingleLineComment(source, current);
    if (singleLineCommentMatch) {
      current = singleLineCommentMatch.index;
      continue;
    }

    // 5. Handle unexpected tokens
    currentToken = String.fromCodePoint(source.codePointAt(current) ?? start);
    current += currentToken.length;
    error(line, `Unexpected token: ${currentToken}`);
  }

  yield {
    type: TokenEnum.EOF,
    lexeme: "",
    literal: undefined,
    line,
  };
}
