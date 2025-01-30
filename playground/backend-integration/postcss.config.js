export default {
  plugins: {
    // using postcss tailwind as aliases does not work with vite plugin one
    // https://github.com/tailwindlabs/tailwindcss/issues/16039
    '@tailwindcss/postcss': {},
  },
}
