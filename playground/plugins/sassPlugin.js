import sass from 'sass'

export const sassPlugin = {
  transforms: [
    {
      as: 'css',
      test(id) {
        return id.endsWith('.scss')
      },
      transform(code) {
        return sass
          .renderSync({
            data: code
          })
          .css.toString()
      }
    }
  ]
}
