// postcss.config.ts

export default {
  plugins: {
    tailwindcss: { config: __dirname + '/tailwind.config.ts' },
    autoprefixer: {},
  },
}
