import fs from "fs";

import { hadError } from "./error";
import { run } from "./run";

function main(a: string[]) {
  console.log("tslox");
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

  if (hadError()) {
    process.exit(1);
  }
}

main(process.argv);

console.log("test");
