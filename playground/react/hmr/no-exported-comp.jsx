// This un-exported react component should not cause this file to be treated
// as an HMR boundary
const Unused = () => <span>An unused react component</span>

export const Foo = {
  is: 'An Object'
}
