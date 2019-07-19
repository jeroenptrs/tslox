const { writeFileSync } = require("fs");

function generateAst(commands) {
  const [, , out] = commands;

  if (!out) {
    console.error("Usage: yarn ast:generate <outputdir>");
    process.exit(1);
  }

  defineAst(
    out,
    "Expr",
    {
      Assign: ["name: Token", "value: Expr"],
      Binary: ["left: Expr", "operator: Token", "right: Expr"],
      Grouping: ["expression: Expr"],
      Literal: ["value: any"],
      Unary: ["operator: Token", "right: Expr"],
      Variable: ["name: Token"],
    },
    ["Token"]
  );

  defineAst(
    out,
    "Stmt",
    {
      Expression: ["expr: Expr"],
      Print: ["expr: Expr"],
      Vrbl: ["name: Token", "initializer: Expr | null"],
    },
    ["Expr", "Token"]
  );
}

function defineAst(outputDir, baseName, types, deps) {
  const path = `${outputDir}/${baseName}.ts`;
  const typeNames = Object.keys(types);

  const data = `// GENERATED FILE! DO NOT EDIT!
${defineImports(deps)}

export abstract class ${baseName} {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export default ${baseName};

${defineVisitorInterface(baseName, typeNames)}

${typeNames.map(type => defineType(baseName, type, types[type])).join("\n")}`;

  writeFileSync(path, data);
}

function defineImports(imports) {
  return imports.map(i => `import { ${i} } from "./${i}";`).join("\n");
}

function defineVisitorInterface(baseName, types) {
  return `export interface Visitor<R> {
${types.map(type => `  visit${type}${baseName}(${type.toLowerCase()}: ${type}): R;`).join("\n")}
}`;
}

function defineType(baseName, type, fields) {
  function fieldName(field) {
    return field.substr(0, field.indexOf(":"));
  }

  return `export class ${type} extends ${baseName} {
${fields.map(field => `  readonly ${field};`).join("\n")}

  constructor(${fields.join(", ")}) {
    super();
${fields.map(field => `    this.${fieldName(field)} = ${fieldName(field)};`).join("\n")}
  }

  public accept<R>(visitor: Visitor<R>): R {
    return visitor.visit${type}${baseName}(this);
  }
}
`;
}

generateAst(process.argv);
