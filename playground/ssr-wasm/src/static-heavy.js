import heavy from './heavy.wasm?init'

export async function render() {
  let result
  const { exported_func } = await heavy({
    imports: {
      imported_func: (res) => (result = res),
    },
  }).then((i) => i.exports)
  exported_func()
  return `<div class="static-heavy">${result}</div>`
}
