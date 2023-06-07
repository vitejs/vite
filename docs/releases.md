# Releases

Vite releases follow [Semantic Versioning](https://semver.org/). You can see the latest stable version of Vite in the [Vite npm package page](https://www.npmjs.com/package/vite).

A full changelog of past releases is [available on GitHub](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md).

::: tip note
The next Vite Major release will happen after the Node 16 EOL in September.

Check out the [Vite 5 discussion](https://github.com/vitejs/vite/discussions/12466) for more information.
:::

## Release Cycle​

Vite does not have a fixed release cycle.

- **Patch** releases are released as needed.
- **Minor** releases always contain new features and are also released as needed. Minor releases always go through a beta pre-release phase.
- **Major** releases generally align with [Node.js EOL schedule](https://endoflife.date/nodejs), and will be announced ahead of time. These releases will go through an early discussion phase, and both alpha and beta pre-release phases.

The previous Vite Major will keep receiving important fixes and security patches. After that, it would only get updates if there are security concerns. We recommend updating Vite regularly. Check out the [Migration Guides](https://vitejs.dev/guide/migration.html) when you update to each Major.

The Vite team partners with the main projects in the ecosystem to test new Vite versions before they are released through the [vite-ecosystem-ci project](https://github.com/vitejs/vite-ecosystem-ci). Most projects using Vite should be able to quickly offer support or migrate to new versions as soon as they are released.

## Semantic Versioning Edge Cases

### TypeScript Definitions​

We may ship incompatible changes to TypeScript definitions between minor versions. This is because:

- Sometimes TypeScript itself ships incompatible changes between minor versions, and we may have to adjust types to support newer versions of TypeScript.
- Occasionally we may need to adopt features that are only available in a newer version of TypeScript, raising the minimum required version of TypeScript.
- If you are using TypeScript, you can use a semver range that locks the current minor and manually upgrade when a new minor version of Vite is released.

### esbuild

[esbuild](https://esbuild.github.io/) is pre-1.0.0 and sometimes it has a breaking change we may need to include to have access to newer features and performance improvements. We may bump the esbuild's version in a Vite Minor.

### Node.js non-LTS versions

Non-LTS Node.js versions (odd-numbered) are not tested as part of Vite's CI, but they should still work before their [EOL](https://endoflife.date/nodejs).

## Pre Releases​

Minor releases typically go through a non-fixed number of beta releases. Major releases will go through an alpha phase and a beta phase.

Pre-releases allow early adopters and maintainers from the Ecosystem to do integration and stability testing, and provide feedback. Do not use pre-releases in production. All pre-releases are considered unstable and may ship breaking changes in between. Always pin to exact versions when using pre-releases.

## Deprecations​

We periodically deprecate features that have been superseded by better alternatives in Minor releases. Deprecated features will continue to work with a type or logged warning. They will be removed in the next major release after entering deprecated status. The [Migration Guide](https://vitejs.dev/guide/migration.html) for each major will list these removals and document an upgrade path for them.

## Experimental Features​

Some features are marked as experimental when released in a stable version of Vite. Experimental features allows us to gather real-world experience to influence their final design. The goal is to let users provide feedback by testing them in production. Experimental features themselves are considered unstable, and should only be used in a controlled manner. These features may change between Minors, so users must pin their Vite version when they rely on them.
