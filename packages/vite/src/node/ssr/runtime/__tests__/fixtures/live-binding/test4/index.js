import C, { update } from "./dep.js";

const x = C.f();
update();
const y = C.f();
export default [x, y];
