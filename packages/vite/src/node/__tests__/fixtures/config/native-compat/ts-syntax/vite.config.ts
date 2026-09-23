enum Mode {
  Dev,
  Prod,
}

const value = 1 as number

export default {
  define: {
    __DIR__: JSON.stringify(__dirname),
    MODE: Mode.Dev,
    VALUE: value,
  },
}
