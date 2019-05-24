import { Scanner } from "./Scanner";

export function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  for (const token of tokens) {
    console.log(token.toString());
  }
}
