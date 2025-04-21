function f() {
  return 0;
}

f = () => 1

export { f as default }

f = () => 2

export function update() {
  f = () => 3;
}
