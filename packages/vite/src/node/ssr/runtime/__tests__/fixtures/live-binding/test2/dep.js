function f() {
  return 0;
}

f = () => 1;

export default f;

f = () => 2;

export function update() {
  f = () => 3;
}
