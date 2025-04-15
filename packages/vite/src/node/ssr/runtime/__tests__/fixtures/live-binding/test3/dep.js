function f() {
  return "before";
}

export { f as default }

export function update() {
  f = () => "after";
}
