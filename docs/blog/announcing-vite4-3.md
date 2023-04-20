---
sidebar: false
head:
  - - meta
    - property: og:type
      content: website
  - - meta
    - property: og:title
      content: Announcing Vite 4.3
  - - meta
    - property: og:image
      content: https://vitejs.dev/og-image-announcing-vite4-3.png
  - - meta
    - property: og:url
      content: https://vitejs.dev/blog/announcing-vite4-3
  - - meta
    - property: og:description
      content: Vite 4.3 Release Announcement
  - - meta
    - name: twitter:card
      content: summary_large_image
---

# Vite 4.3 is out!

_April 20, 2023_

![Vite 4.3 Announcement Cover Image](/og-image-announcing-vite4-3.png)

Quick links:

- Docs: [English](/), [简体中文](https://cn.vitejs.dev/), [日本語](https://ja.vitejs.dev/), [Español](https://es.vitejs.dev/), [Português](https://pt.vitejs.dev/)
- [Vite 4.3 Changelog](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md#430-2023-04-20)

## Performance Improvements

In this minor, we focused on improving the dev server performance. The resolve logic got streamlined, improving hot paths and implementing smarter caching for finding `package.json`, TS config files, and resolved URL in general.

You can read a detailed walkthrough of the performance work done in this blog post by one of Vite Contributors: [How we made Vite 4.3 faaaaster 🚀](https://sun0day.github.io/blog/vite/why-vite4_3-is-faster.html).

This sprint resulted in speed improvements across the board compared to Vite 4.2.

These are the performance improvements as measured by [sapphi-red/performance-compare](https://github.com/sapphi-red/performance-compare), which tests an app with 1000 React Components cold and warm dev server startup time as well as HMR times for a root and a leaf component:

| **Vite (babel)**   |  Vite 4.2 | Vite 4.3 | Improvement |
| :----------------- | --------: | -------: | ----------: |
| **dev cold start** | 17249.0ms | 5132.4ms |      -70.2% |
| **dev warm start** |  6027.8ms | 4536.1ms |      -24.7% |
| **Root HMR**       |    46.8ms |   26.7ms |      -42.9% |
| **Leaf HMR**       |    27.0ms |   12.9ms |      -52.2% |

| **Vite (swc)**     |  Vite 4.2 | Vite 4.3 | Improvement |
| :----------------- | --------: | -------: | ----------: |
| **dev cold start** | 13552.5ms | 3201.0ms |      -76.4% |
| **dev warm start** |  4625.5ms | 2834.4ms |      -38.7% |
| **Root HMR**       |    30.5ms |   24.0ms |      -21.3% |
| **Leaf HMR**       |    16.9ms |   10.0ms |      -40.8% |

![Vite 4.3 vs 4.2 startup time comparison](/vite4-3-startup-time.png)

![Vite 4.3 vs 4.2 HMR time comparison](/vite4-3-hmr-time.png)

You can read more information about the benchmark [here](https://gist.github.com/sapphi-red/25be97327ee64a3c1dce793444afdf6e). Specs and Versions for this performance run:

- CPU: Ryzen 9 5900X, Memory: DDR4-3600 32GB, SSD: WD Blue SN550 NVME SSD
- Windows 10 Pro 21H2 19044.2846
- Node.js 18.16.0
- Vite and React Plugin versions
  - Vite 4.2 (babel): Vite 4.2.1 + plugin-react 3.1.0
  - Vite 4.3 (babel): Vite 4.3.0 + plugin-react 4.0.0-beta.1
  - Vite 4.2 (swc): Vite 4.2.1 + plugin-react-swc 3.2.0
  - Vite 4.3 (swc): Vite 4.3.0 + plugin-react-swc 3.3.0

Early adopters have also reported seeing 1.5x-2x dev startup time improvement on real apps while testing the Vite 4.3 beta. We'd love to know the results for your apps.

## Profiling

We'll continue to work on Vite's performance. We're working on an official [Benchmark tool](https://github.com/vitejs/vite-benchmark) for Vite that let us get performance metrics for each Pull Request.

And [vite-plugin-inspect](https://github.com/antfu/vite-plugin-inspect) now has more performance-related features to help you identify which plugins or middlewares are the bottleneck for your applications.

Using `vite --profile` (and then pressing `p`) once the page loads will save a CPU profile of the dev server startup. You can open them in an app as [speedscope](https://www.speedscope.app/) to identify performance issues. And you can share your findings with the Vite Team in a [Discussion](https://github.com/vitejs/vite/discussions) or in [Vite's Discord](https://chat.vitejs.dev).

## Next Steps

We decided to do a single Vite Major this year aligning with the [EOL of Node.js 16](https://endoflife.date/nodejs) in September, dropping support for both Node.js 14 and 16 in it. If you would like to get involved, we started a [Vite 5 Discussion](https://github.com/vitejs/vite/discussions/12466) to gather early feedback.
