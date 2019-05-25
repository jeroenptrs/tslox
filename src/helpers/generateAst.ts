import { writeFileSync } from "fs";

function generateAst(commands: string[]) {
  const [, , out] = commands;

  if (!out) {
    console.error("Usage: yarn ast:generate <outputdir>");
    process.exit(1);
  }

  defineAst(out, "Expr", {
    Binary: ["left: Expr", "operator: Token", "right: Expr"],
    Grouping: ["expression: Expr"],
    Literal: ["value: any"],
    Unary: ["operator: Token", "right: Expr"]
  });
}

function defineAst(outputDir: string, baseName: string, types: { [key: string]: string[] }) {
  const path = `${outputDir}/${baseName}.ts`;
  const typeNames = Object.keys(types);

  const data = `// GENERATED FILE! DO NOT EDIT!
import { Token } from "./Token";

export abstract class ${baseName} {
  abstract accept<R>(visitor: Visitor<R>): R;
}

${defineVisitorInterface(baseName, typeNames)}

${typeNames.map(type => defineType(baseName, type, types[type])).join("\n")}`;

  writeFileSync(path, data);
}

function defineVisitorInterface(baseName: string, types: string[]): string {
  return `export interface Visitor<R> {
${types.map(type => `  visit${type}${baseName}(${type.toLowerCase()}: ${type}): R;`).join("\n")}
}`;
}

function defineType(baseName: string, type: string, fields: string[]): string {
  function fieldName(field: string): string {
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
