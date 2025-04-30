import f, { update } from "./dep.js";

const x = f();
update();
const y = f();
export default [x, y];
