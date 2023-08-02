import { TokenEnum } from "../enums";

export const identifierKeywords: Record<string, TokenEnum> = {
  and: TokenEnum.AND,
  class: TokenEnum.CLASS,
  else: TokenEnum.ELSE,
  false: TokenEnum.FALSE,
  for: TokenEnum.FOR,
  fun: TokenEnum.FUN,
  if: TokenEnum.IF,
  nil: TokenEnum.NIL,
  or: TokenEnum.OR,
  print: TokenEnum.PRINT,
  return: TokenEnum.RETURN,
  super: TokenEnum.SUPER,
  this: TokenEnum.THIS,
  true: TokenEnum.TRUE,
  var: TokenEnum.VAR,
  while: TokenEnum.WHILE,
};
