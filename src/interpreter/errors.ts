export const binaryOperands = "Operands must be two numbers or two strings.";
export const call = "Can only call functions and classes.";
export const expectedArguments = (arity: number, length: number) =>
  `Expected ${arity} arguments but got ${length} instead.`;
export const instanceFields = "Only instances have fields.";
export const instanceProperties = "Only instances have properties";
export const stringConcat = "Left operand must be a string to concat strings.";
export const superClass = "Superclass must be a class";
export const undefinedProperty = (lexeme: string) => `Undefined property ${lexeme}.`;
export const undefinedVar = (lexeme: string) => `Undefined variable ${lexeme}.`;
