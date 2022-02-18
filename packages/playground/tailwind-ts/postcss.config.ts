import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config'

export default {
  plugins: [tailwind(tailwindConfig), autoprefixer()]
}
