function testRegex(regex: RegExp) {
  return function (source: string, index: number) {
    regex.lastIndex = index;
    const match = regex.exec(source);
    if (match) match.index = regex.lastIndex;
    return match;
  };
}

export const testPunctuation = testRegex(/-{1}|\+{1}|\.|\*|(?:>|<|=|!)=?|[,;(){}]/y);
export const testIdentifier = testRegex(
  /(\x23?)(?=[$_\p{ID_Start}\\])(?:[$_\u200C\u200D\p{ID_Continue}]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+/uy
);
export const testStringLiteral = testRegex(/(["])(?:(?!\1)[^\\\n\r]|\\(?:\r\n|[^]))*(\1)?/y);
export const testNumericLiteral = testRegex(
  /(?:0[xX][\da-fA-F](?:_?[\da-fA-F])*|0[oO][0-7](?:_?[0-7])*|0[bB][01](?:_?[01])*)n?|0n|[1-9](?:_?\d)*n|(?:(?:0(?!\d)|0\d*[89]\d*|[1-9](?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?|0[0-7]+/y
);
export const testWhiteSpace = testRegex(/[\t\v\f\ufeff\p{Zs}]+/uy);
export const testNewLine = testRegex(/\r?\n|[\r\u2028\u2029]/y);
export const testSingleLineComment = testRegex(/\/\/.*/y);
