import * as Expr from "./Expr";

export class AstPrinter implements Expr.Visitor<string> {
  print(expr: Expr.Expr): string {
    return expr.accept(this);
  }

  public visitBinaryExpr(expr: Expr.Binary) {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  public visitGroupingExpr(expr: Expr.Grouping) {
    return this.parenthesize("group", expr.expression);
  }

  public visitLiteralExpr(expr: Expr.Literal) {
    if (expr.value === null) return "nil";
    return expr.value.toString();
  }

  public visitUnaryExpr(expr: Expr.Unary) {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr.Expr[]): string {
    return `(${name} ${exprs.map(expr => expr.accept(this)).join(" ")})`;
  }
}
