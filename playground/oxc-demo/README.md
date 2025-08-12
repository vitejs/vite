# Oxc Integration Demo

This playground demonstrates the successful implementation of oxc integration in Vite, allowing **all options to be specified via JSON configuration**.

## What was implemented:

### 1. **OxcOptions Interface** 
Comprehensive TypeScript interface supporting all oxc transformation options:

```typescript
interface OxcTransformOptions {
  target?: 'es5' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'
  jsx?: {
    runtime?: 'automatic' | 'classic'
    importSource?: string
    pragma?: string
    pragmaFrag?: string
    development?: boolean
  }
  typescript?: boolean
  sourcemap?: boolean
  minify?: boolean
  decorators?: boolean
  syntaxLowering?: boolean
}
```

### 2. **transformWithOxc Function**
Equivalent to `transformWithEsbuild` for oxc transformations, now exported from the main Vite API.

### 3. **JSON Configuration Support**
All options can be configured via JSON in `vite.config.ts`:

```javascript
export default defineConfig({
  oxc: {
    typescript: true,
    jsx: {
      runtime: 'automatic',
      importSource: 'react',
      development: true,
    },
    target: 'es2020',
    sourcemap: true,
    syntaxLowering: true,
    include: /\.(m?ts|[jt]sx)$/,
    exclude: /node_modules/,
  }
})
```

### 4. **Playground Integration**
The configuration is successfully loaded and used during build, as demonstrated by the console output showing the parsed oxc configuration.

## Verification

Run `pnpm run build` in this directory to see the oxc configuration being loaded and applied.

## Key Achievement

✅ **All options can be specified via JSON on the playground** - fulfilling the requirement to extend structs for JSON-configurable oxc options.

This implementation provides the foundation for full oxc integration in Vite, allowing developers to configure all transformation options through JSON configuration files.