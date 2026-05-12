# Caching Behavior in Vite

This document explains the caching behavior in Vite for both development and production modes.

## Development Mode

### Dependency Pre-bundling Cache

In development mode, Vite uses a cache directory (`.vite`) to store pre-bundled dependencies. This cache significantly speeds up server startup time.

#### How it works

1. **First run**: Vite scans your source code for dependencies
2. **Pre-bundling**: Dependencies are bundled using esbuild
3. **Caching**: Bundled dependencies are stored in `.vite/deps`
4. **Subsequent runs**: Vite checks if dependencies have changed
   - If unchanged: Uses cached version (fast startup)
   - If changed: Re-bundles and updates cache

#### Cache Location

The cache is stored in:
- **Default**: `node_modules/.vite`
- **Custom**: Configurable via `cacheDir` option

```javascript
// vite.config.js
export default {
  cacheDir: '.vite-cache'
}
```

#### Cache Invalidation

The cache is invalidated when:
- `package.json` changes
- Lock file changes (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
- `vite.config.js` changes (in some cases)
- Dependencies are added/removed

#### Manual Cache Clearing

```bash
# Clear the cache
rm -rf node_modules/.vite

# Or using npm script
npm run dev -- --force
```

### Module Cache

Individual modules are also cached in memory during development:

- **Hot Module Replacement (HMR)**: Modules are cached and only updated when changed
- **Transform cache**: Source code transformations are cached
- **Dependency graph**: Module dependencies are tracked and cached

### File System Cache

Vite uses the file system cache for:
- Pre-bundled dependencies
- CSS preprocessing results
- TypeScript compilation results
- JSX transformation results

## Production Mode

### Build Caching

In production mode, Vite's caching behavior is different:

1. **No persistent cache**: Production builds don't use a persistent cache by default
2. **Full rebuild**: Each production build processes all modules from scratch
3. **Optimization**: Build optimizations (minification, tree-shaking) are applied each time

#### Why No Cache?

Production builds are typically:
- Run in CI/CD pipelines
- Deployed to different environments
- Expected to be deterministic
- Optimized for size, not speed

#### Build Performance

For faster production builds:

1. **Use `build.cache` option** (experimental):
```javascript
// vite.config.js
export default {
  build: {
    cache: true
  }
}
```

2. **Enable persistent caching**:
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      cache: true
    }
  }
}
```

3. **Use build caching tools**:
```bash
# Using turborepo
turbo run build

# Using nx
nx build my-app
```

### Asset Caching

Production builds include asset optimization:

#### Content Hashing

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  }
}
```

#### Cache Headers

Configure cache headers for static assets:

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        // Long cache for hashed assets
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
}
```

## Browser Caching

### Development Mode

- **No caching**: Development server sets `Cache-Control: no-cache`
- **HMR updates**: Files are served with `Cache-Control: no-cache, no-store, must-revalidate`
- **Source maps**: Always fresh

### Production Mode

- **Long cache**: Hashed assets get `Cache-Control: public, max-age=31536000, immutable`
- **No cache**: HTML files get `Cache-Control: no-cache`
- **Service worker**: Can implement custom caching strategies

#### Example Cache Headers

```
# Hashed assets (long cache)
/assets/index.abc123.js
Cache-Control: public, max-age=31536000, immutable

# HTML files (no cache)
/index.html
Cache-Control: no-cache

# API responses (custom)
/api/data
Cache-Control: public, max-age=3600
```

## Cache Configuration

### Development Cache Options

```javascript
// vite.config.js
export default {
  // Cache directory
  cacheDir: '.vite',
  
  // Dependency optimization
  optimizeDeps: {
    // Force re-bundling
    force: false,
    
    // Include specific dependencies
    include: ['lodash', 'axios'],
    
    // Exclude specific dependencies
    exclude: ['my-local-package']
  }
}
```

### Production Cache Options

```javascript
// vite.config.js
export default {
  build: {
    // Enable build cache (experimental)
    cache: true,
    
    // Rollup cache options
    rollupOptions: {
      cache: true
    }
  }
}
```

## Best Practices

### Development

1. **Don't clear cache unnecessarily**: Let Vite manage the cache
2. **Use `--force` flag**: Only when you suspect cache corruption
3. **Check `.vite` directory**: Monitor cache size and contents
4. **Use `optimizeDeps.include`**: Pre-bundle frequently used dependencies

### Production

1. **Use CI caching**: Cache `node_modules` and build artifacts
2. **Enable build cache**: Use experimental `build.cache` option
3. **Use content hashing**: Enable long-term caching for static assets
4. **Configure cache headers**: Set appropriate `Cache-Control` headers

### CI/CD

```yaml
# Example GitHub Actions workflow
name: Build
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Cache build
        uses: actions/cache@v3
        with:
          path: dist
          key: build-${{ hashFiles('src/**') }}
```

## Troubleshooting

### Cache Corruption

**Symptoms**: Build errors, unexpected behavior

**Solution**:
```bash
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
npm run build -- --force
```

### Stale Cache

**Symptoms**: Changes not reflected in development

**Solution**:
```bash
# Clear development cache
rm -rf node_modules/.vite
npm run dev
```

### Large Cache Size

**Symptoms**: `.vite` directory is very large

**Solution**:
```bash
# Check cache size
du -sh node_modules/.vite

# Clear if needed
rm -rf node_modules/.vite
```

## Performance Impact

### Development Mode

- **First startup**: 2-5 seconds (dependency pre-bundling)
- **Subsequent startups**: 0.5-1 seconds (cache hit)
- **HMR updates**: < 100ms (in-memory cache)

### Production Mode

- **Full build**: 10-30 seconds (depending on project size)
- **Cached build**: 5-15 seconds (with build cache)
- **Asset optimization**: Automatic content hashing

## Related Documentation

- [Dependency Pre-Bundling](https://vite.dev/guide/dep-pre-bundling)
- [Build Options](https://vite.dev/config/build-options)
- [Performance Optimization](https://vite.dev/guide/performance)
