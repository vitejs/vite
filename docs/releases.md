# Releases

Vite releases follow [Semantic Versioning](https://semver.org/). You can see the latest stable version of Vite in the [Vite npm package page](https://www.npmjs.com/package/vite).

A full changelog of past releases is [available on GitHub](https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md).

## Release Cycle

Vite does not have a fixed release cycle.

- **Patch** releases are released as needed (usually every week).
- **Minor** releases always contain new features and are released as needed. Minor releases always have a beta pre-release phase (usually every two months).
- **Major** releases generally align with [Node.js EOL schedule](https://endoflife.date/nodejs), and will be announced ahead of time. These releases will go through long-term discussions with the ecosystem, and have alpha and beta pre-release phases (usually every year).

The Vite versions ranges that are supported by the Vite team is automatically determined by:

- **Current Minor** gets regular fixes.
- **Previous Major** (only for its latest minor) and **Previous Minor** receives important fixes and security patches.
- **Second-to-last Major** (only for its latest minor) and **Second-to-last Minor** receives security patches.
- All versions before these are no longer supported.

As an example, if the Vite latest is at 5.3.10:

- Regular patches are released for `vite@5.3`.
- Important fixes and security patches are backported to `vite@4` and `vite@5.2`.
- Security patches are also backported to `vite@3`, and `vite@5.1`.
- `vite@2` and `vite@5.0` are no longer supported. Users should upgrade to receive updates.

We recommend updating Vite regularly. Check out the [Migration Guides](https://vitejs.dev/guide/migration.html) when you update to each Major. The Vite team works closely with the main projects in the ecosystem to ensure the quality of new versions. We test new Vite versions before releasing them through the [vite-ecosystem-ci project](https://github.com/vitejs/vite-ecosystem-ci). Most projects using Vite should be able to quickly offer support or migrate to new versions as soon as they are released.

## Semantic Versioning Edge Cases

### TypeScript Definitions

We may ship incompatible changes to TypeScript definitions between minor versions. This is because:

- Sometimes TypeScript itself ships incompatible changes between minor versions, and we may have to adjust types to support newer versions of TypeScript.
- Occasionally we may need to adopt features that are only available in a newer version of TypeScript, raising the minimum required version of TypeScript.
- If you are using TypeScript, you can use a semver range that locks the current minor and manually upgrade when a new minor version of Vite is released.

### esbuild

[esbuild](https://esbuild.github.io/) is pre-1.0.0 and sometimes it has a breaking change we may need to include to have access to newer features and performance improvements. We may bump the esbuild's version in a Vite Minor.

### Node.js non-LTS versions

Non-LTS Node.js versions (odd-numbered) are not tested as part of Vite's CI, but they should still work before their [EOL](https://endoflife.date/nodejs).

## Pre Releases

Minor releases typically go through a non-fixed number of beta releases. Major releases will go through an alpha phase and a beta phase.

Pre-releases allow early adopters and maintainers from the Ecosystem to do integration and stability testing, and provide feedback. Do not use pre-releases in production. All pre-releases are considered unstable and may ship breaking changes in between. Always pin to exact versions when using pre-releases.

## Deprecations

We periodically deprecate features that have been superseded by better alternatives in Minor releases. Deprecated features will continue to work with a type or logged warning. They will be removed in the next major release after entering deprecated status. The [Migration Guide](https://vitejs.dev/guide/migration.html) for each major will list these removals and document an upgrade path for them.

## Experimental Features

Some features are marked as experimental when released in a stable version of Vite. Experimental features allow us to gather real-world experience to influence their final design. The goal is to let users provide feedback by testing them in production. Experimental features themselves are considered unstable, and should only be used in a controlled manner. These features may change between Minors, so users must pin their Vite version when they rely on them. We will create [a GitHub discussion](https://github.com/vitejs/vite/discussions/categories/feedback?discussions_q=is%3Aopen+label%3Aexperimental+category%3AFeedback) for each experimental feature.
