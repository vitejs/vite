module.exports = {
  plugins: [replacePinkWithGreen]
}

function replacePinkWithGreen() {
  return {
    postcssPlugin: 'replace-pink-with-green',
    Declaration(decl) {
      if (decl.value === 'pink') {
        decl.value = 'green'
      }
    }
  }
}
replacePinkWithGreen.postcss = true
