import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import lox from "./lox";

const [, , ...args] = process.argv;

if (args.length < 1) {
  console.warn("tslox needs a filepath as input");
  process.exit(1);
}

runFile(args[0] as string);

function runFile(filePath: string) {
  const src = readFileSync(resolve(process.cwd(), filePath), "utf8");

  const loxResult = lox(src);
  if (loxResult) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}
