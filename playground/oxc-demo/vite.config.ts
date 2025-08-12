import { defineConfig } from 'vite'

export default defineConfig({
  // Enable both esbuild and oxc for comparison
  esbuild: {
    target: 'es2020',
    jsx: 'transform',
  },
  
  // Example oxc configuration - demonstrating JSON-configurable options
  oxc: {
    // TypeScript transformation
    typescript: true,
    
    // JSX configuration
    jsx: {
      runtime: 'automatic',
      importSource: 'react',
      development: true,
    },
    
    // ES target
    target: 'es2020',
    
    // Enable sourcemaps
    sourcemap: true,
    
    // Enable syntax lowering
    syntaxLowering: true,
    
    // File patterns to include/exclude
    include: /\.(m?ts|[jt]sx)$/,
    exclude: /node_modules/,
  },
  
  plugins: [
    // Custom plugin to demonstrate oxc options usage
    {
      name: 'oxc-demo',
      configResolved(config) {
        // This demonstrates the config.oxc options mentioned in the rolldown documentation
        console.log('Oxc config:', config.oxc)
      }
    }
  ]
})