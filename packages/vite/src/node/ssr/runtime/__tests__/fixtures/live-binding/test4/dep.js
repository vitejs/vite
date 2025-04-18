export default class C {
  static f = () => 0;
}

C = class {
  static f = () => 1;
}

C = class {
  static f = () => 2;
}

export function update() {
  C = class {
    static f = () => 3;
  }
}
