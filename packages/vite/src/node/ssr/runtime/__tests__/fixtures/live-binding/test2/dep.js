function f() {
  return "before";
}

export default f;

export function update() {
  f = () => "after";
}
