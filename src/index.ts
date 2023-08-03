import lox from "./lox";
import { src } from "./test/src";

const loxResult = lox(src);
if (loxResult) {
  process.exit(0);
} else {
  process.exit(65);
}
