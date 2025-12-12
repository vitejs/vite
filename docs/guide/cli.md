---
outline: 2
---

<script setup>
import { data } from '../_data/cli-vite.data'
</script>

# Command Line Interface

## `vite`

Start the Vite dev server in the current directory. `vite dev` and `vite serve` are aliases for `vite`.

### Usage

```bash
vite [root]
```

### Options

<!-- render as html -->
<div v-html="data.viteDevFlags"></div>

## `vite build`

Build for production.

### Usage

```bash
vite build [root]
```

### Options

<div v-html="data.viteBuildFlags"></div>

## `vite optimize`

Pre-bundle dependencies.

**Deprecated**: the pre-bundle process runs automatically and does not need to be called.

### Usage

```bash
vite optimize [root]
```

### Options

<div v-html="data.viteOptimizeFlags"></div>

## `vite preview`

Locally preview the production build. Do not use this as a production server as it's not designed for it.

This command starts a server in the build directory (by default `dist`). Run `vite build` beforehand to ensure that the build directory is up-to-date. Depending on the project's configured [`appType`](/config/shared-options.html#apptype), it makes use of certain middleware.

### Usage

```bash
vite preview [root]
```

### Options

<div v-html="data.vitePreviewFlags"></div>

## Shared Options

These options are available for all commands.

<div v-html="data.globalFlags"></div>
