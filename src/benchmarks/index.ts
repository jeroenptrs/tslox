import scanner from "../scanner";
import { isToken } from "../Token";
import { TokenEnum } from "../enums";
import type { ErrorFn } from "../types";

const src = `var now1 = clock();

var a = nil;
var b = 1;

if (a) {
  a = 1;
} else if (b == 2) {
  a = 2;
} else {
  var now2 = clock();
  a = 3;
  print now2;
}

print a;

var d = 1;
for (var c = 0; c < 10; c = c + d) {
  print c;
  if (d < 3) d = d + 1;
}

print now1;

fun sayHi(first, last) {
  print "Hi, " + first + " " + last + "!";
}

sayHi("Dear", "Reader");

fun fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 2) + fibonacci(n - 1);
}

for (var i = 0; i < 10; i = i + 1) {
  print fibonacci(i);
}

fun makePoint(x, y) {
  fun closure(method) {
    if (method == "x") return x;
    if (method == "y") return y;
    print "unknown method " + method;
  }

  return closure;
}

var point = makePoint(2, 3);
print point("x"); // "2".
print point("y"); // "3".
`;

let hadError = false;
function report(line: number, where: string, message: string) {
  hadError = true;
  console.error(`[line: ${line}]: Error ${where}: ${message}`);
}
const error: ErrorFn = (lineOrToken, message) => {
  if (isToken(lineOrToken)) {
    report(
      lineOrToken.line,
      lineOrToken.type === TokenEnum.EOF ? " at end" : `at '${lineOrToken.lexeme}'`,
      message
    );
  } else {
    report(lineOrToken, "", message);
  }
};

hadError;

import jsTokens from "js-tokens";
import { Scanner } from "./Scanner";
const loops = 10_000;

const l3 = performance.now();
const oldScan = new Scanner(src, () => {});
for (let i = 0; i < loops; i++) {
  oldScan.scanTokens();
}
const l4 = performance.now();
console.log(`Time it takes to run ${loops} loops in Old Lox: ${l4 - l3} ms`);

const j1 = performance.now();
for (let i = 0; i < loops; i++) {
  Array.from(jsTokens(src));
}
const j2 = performance.now();
console.log(`Time it takes to run ${loops} loops in js-tokens: ${j2 - j1} ms`);

const l1 = performance.now();
for (let i = 0; i < loops; i++) {
  Array.from(scanner(src, error));
}
const l2 = performance.now();
console.log(`Time it takes to run ${loops} loops in Lox: ${l2 - l1} ms`);
