const x = () => 1

class C {
  prop = x()
  constructor(x) {
    console.log(x)
  }
}

export { C }
