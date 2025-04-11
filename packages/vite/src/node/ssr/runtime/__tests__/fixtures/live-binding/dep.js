export default function f() {
  return "before";
}

export function update() {
  f = () => "after";
}
