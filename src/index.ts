import fs from "fs";

import { hadError, hadRuntimeError } from "./helpers/error";
import { run } from "./run";

function main(a: string[]) {
  const [, , ...args] = a;

  if (args.length < 1) {
    console.warn("tslox needs a filepath as input");
    return;
  }

  runFile(args[0]);
}

function runFile(filePath: string) {
  const source = fs.readFileSync(filePath, "utf8");
  run(source);

  if (hadError() || hadRuntimeError()) process.exit(1);
}

main(process.argv);
