import { writeFileSync } from "node:fs";

function generateAst(commands: string[]) {
  const [, , out] = commands;

  if (!out) {
    console.error("Usage: yarn generate");
    process.exit(1);
  }

  defineAst(
    out,
    "Expression",
    {
      Assign: ["name: Token", "value: Expression"],
      Binary: ["left: Expression", "operator: Token", "right: Expression"],
      Call: ["callee: Expression", "paren: Token", "args: Expression[]"],
      Get: ["obj: Expression", "name: Token"],
      Grouping: ["expression: Expression"],
      Literal: ["value: TLiteral"],
      Logical: ["left: Expression", "operator: Token", "right: Expression"],
      Set: ["obj: Expression", "name: Token", "value: Expression"],
      LoxSuper: ["keyword: Token", "method: Token"],
      LoxThis: ["keyword: Token"],
      Unary: ["operator: Token", "right: Expression"],
      Variable: ["name: Token"],
    },
    [`type { Token, Literal as TLiteral } from "./types"`]
  );

  defineAst(
    out,
    "Statement",
    {
      Block: ["statements: Statement[]"],
      LoxClass: ["name: Token", "superclass: Expr.Variable | null", "methods: Fun[]"],
      Expression: ["expr: Expr.Expression"],
      Fun: ["name: Token", "params: Token[]", "funBody: Statement[]"],
      IfElse: [
        "condition: Expr.Expression",
        "thenBranch: Statement",
        "elseBranch: Statement | null",
      ],
      Print: ["expr: Expr.Expression"],
      ReturnValue: ["keyword: Token", "value: Expr.Expression | null"],
      Variable: ["name: Token", "initializer: Expr.Expression | null"],
      LoxWhile: ["condition: Expr.Expression", "body: Statement"],
    },
    [`* as Expr from "./Expression"`, `type { Token } from "./types"`]
  );
}

function defineAst(
  outputDir: string,
  baseName: string,
  types: Record<string, string[]>,
  deps: string[]
) {
  const path = `${outputDir}/${baseName}.ts`;
  const typeNames = Object.keys(types);

  const data = `// GENERATED FILE! DO NOT EDIT!
${defineImports(deps)}

export abstract class ${baseName} {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default ${baseName};

${defineVisitorInterface(baseName, typeNames)}

${typeNames.map((type) => defineType(baseName, type, types[type] as string[])).join("\n")}`;

  writeFileSync(path, data);
}

function defineImports(imports: string[]) {
  return imports.map((i) => `import ${i};`).join("\n");
}

function defineVisitorInterface(baseName: string, types: string[]) {
  function defineVisitorType(type: string) {
    return `${type[0]?.toLowerCase()}${type.substring(1)}`;
  }

  return `export interface Visitor<R> {
${types
  .map((type) => `  visit${type}${baseName}(${defineVisitorType(type)}: ${type}): R;`)
  .join("\n")}
}`;
}

function defineType(baseName: string, type: string, fields: string[]) {
  function defineConstructor(fields: string[]) {
    const superField = "    super();";

    if (fields.length < 2) {
      return `  constructor(${fields.map((field) => `readonly ${field}`).join("")}) {
${superField}
  }`;
    }

    return `  constructor(
${fields.map((field) => `    readonly ${field}`).join(",\n")}
  ) {
${superField}
  }`;
  }

  return `export class ${type} extends ${baseName} {
${defineConstructor(fields)}

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visit${type}${baseName}(this);
  }
}
`;
}

generateAst(process.argv);
