const fs = require("fs");

const { Lox } = require("../dist");

function main(a) {
  const [, , ...args] = a;

  if (args.length < 1) {
    console.warn("tslox needs a filepath as input");
    return;
  }

  runFile(args[0]);
}

function runFile(filePath) {
  const L = new Lox(console);
  const source = fs.readFileSync(filePath, "utf8");
  process.exit(L.run(source) ? 0 : 1);
}

main(process.argv);
