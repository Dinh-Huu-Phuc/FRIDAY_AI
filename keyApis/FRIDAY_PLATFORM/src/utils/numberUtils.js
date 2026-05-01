export function compactNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(Number(value || 0));
}
