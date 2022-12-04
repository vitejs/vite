module.exports = {
  plugins: [replacePinkWithBlue],
}

function replacePinkWithBlue() {
  return {
    postcssPlugin: 'replace-pink-with-blue',
    Declaration(decl) {
      if (decl.value === 'pink') {
        decl.value = 'blue'
      }
    },
  }
}
replacePinkWithBlue.postcss = true
