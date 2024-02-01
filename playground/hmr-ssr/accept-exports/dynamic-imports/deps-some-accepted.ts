export const a = 'a0'

export const b = 'b0'

const aliased = 'c0'
export { aliased as c }

export default 'default0'

log(`some >>>>>> ${a}, ${b}, ${aliased}`)

if (import.meta.hot) {
  import.meta.hot.acceptExports(['a', 'b', 'default'])
}
