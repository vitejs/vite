console.log(__dirname + '/tailwind.config.js')

module.exports = {
  plugins: {
    tailwindcss: { config: __dirname + '/tailwind.config.js' },
  },
}
