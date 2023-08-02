import { readFileSync } from "node:fs";
import { cwd } from "node:process";
import { resolve } from "node:path";

export const src = readFileSync(resolve(cwd(), "test", "test9.lox"), { encoding: "utf-8" });
