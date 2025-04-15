export default function f() {
  return 0;
}

f = () => 1;

f = () => 2;

export function update() {
  f = () => 3;
}
