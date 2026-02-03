## Problem

Vite's build command cannot output build statistics in a machine-readable format.

## Expected Behavior

**CLI:**

- `vite build --json` - Output JSON to stdout, suppress normal logs
- `vite build --json <filename>` - Write JSON to file, create parent directories

**Output Structure:**

{
"version": "...",
"timestamp": ...,
"duration": ...,
"success": true,
"outputs": {
"<environment-name>": {
"outDir": "...",
"chunks": [
{
"name": "...",
"type": "chunk",
"size": ...,
"gzipSize": ...,
"isEntry": ...,
"isDynamicEntry": ...,
"modules": [...],
"imports": [...],
"dynamicImports": [...]
}
],
"assets": [
{
"name": "...",
"type": "asset",
"size": ...,
"gzipSize": ...
}
],
"totals": {
"chunkCount": ...,
"assetCount": ...,
"totalSize": ...,
"totalGzipSize": ...
}
}
},
"warnings": [{ "message": "..." }],
"errors": [{ "message": "..." }]
}

**Requirements:**

- 2-space indentation
- Exclude `*.map` files
- Sort chunks/assets by size descending
- `gzipSize` is null for non-compressible files or when `build.reportCompressedSize` is false
- `totalSize` is sum of all chunk and asset sizes
- `totalGzipSize` is sum of all non-null gzip sizes (null when `build.reportCompressedSize` is false)
- Output JSON even on build failure with `success: false`
- `outDir` must be absolute path
