# Environment API

:::warning Experimental
Initial work for this API was introduced in Vite 5.1 with the name "Vite Runtime API". This guide describes a revised API, renamed to Environment API. This API will be released in Vite 6 as experimental. You can already test it in the latest `vite@6.0.0-beta.x` version.

Resources:

- [Feedback discussion](https://github.com/vitejs/vite/discussions/16358) where we are gathering feedback about the new APIs.
- [Environment API PR](https://github.com/vitejs/vite/pull/16471) where the new API were implemented and reviewed.

Please share with us your feedback as you test the proposal.
:::

## Formalizing Environments

Vite 6 formalizes the concept of Environments. Until Vite 5, there were two implicit Environments (`client` and `ssr`). The new Environment API allows users to create as many environments as needed to map the way their apps work in production. This new capabilities required a big internal refactoring, but a big effort has been placed on backward compatibility. The initial goal of Vite 6 is to move the ecosystem to the new major as smoothly as possible, delaying the adoption of these new experimental APIs until enough users have migrated and frameworks and plugin authors have validated the new design.

## Closing the gap between build and dev

For a simple SPA, there is a single environment. The app will run in the user browser. During dev, except for Vite's requiring a modern browser, the environment matches closely the production runtime. In Vite 6, it would still be possible to use Vite without users knowing about environments. The usual vite config works for the default client environment in this case.

In a typical server side rendered Vite app, there are two environments. The client environment is running the app in the browser, and the node environment runs the server that performs SSR. When running Vite in dev mode, the server code is executed in the same Node process as the Vite dev server giving a close approximation of the production environment. But an app can run servers in other JS runtimes, like [Cloudflare's workerd](https://github.com/cloudflare/workerd). And it is also common for modern apps to have more than two environments (for example, an app could be running by a browser, a node server, and an edge server). Vite 5 didn't allow for these cases to be properly represented.

Vite 6 allows users to configure their app during build and dev to map all of its environments. During dev, a single Vite dev server can now be used to run code in multiple different environments concurrently. The app source code is still transformed by Vite dev server. On top of the shared HTTP server, middlewares, resolved config, and plugins pipeline, the Vite server now has a set of independent dev environments. Each of them is configured to match the production environment as closely as possible, and is connected to a dev runtime where the code is executed (for workerd, the server code can now run in miniflare locally). In the client, the browser imports and executes the code. In other environments, a module runner fetches and evaluates the transformed code.

![Vite Environments](../images/vite-environments.svg)

## Environment Configuration

Environments are explicitly configured with the `environments` config option.

```js
export default {
  environments: {
    client: {
      resolve: {
        conditions: [], // configure the Client environment
      },
    },
    ssr: {
      dev: {
        optimizeDeps: {}, // configure the SSR environment
      },
    },
    rsc: {
      resolve: {
        noExternal: true, // configure a custom environment
      },
    },
  },
}
```

All environment configs extend from user's root config, allowing users add defaults for all environments at the root level. This is quite useful for the common use case of configuring a Vite client only app, that can be done without going through `environments.client`.

```js
export default {
  resolve: {
    conditions: [], // configure a default for all environments
  },
}
```

The `EnvironmentOptions` interface exposes all the per-environment options. There are `SharedEnvironmentOptions` that apply to both `build` and `dev`, like `resolve`. And there are `DevEnvironmentOptions` and `BuildEnvironmentOptions` for dev and build specific options (like `dev.optimizeDeps` or `build.outDir`).

```ts
interface EnvironmentOptions extends SharedEnvironmentOptions {
  dev: DevOptions
  build: BuildOptions
}
```

As we explained, Environment specific options defined at the root level of user config are used for the default client environment (the `UserConfig` interface extends from the `EnvironmentOptions` interface). And environments can be configured explicitly using the `environments` record. The `client` and `ssr` environments are always present during dev, even if an empty object is set to `environments`. This allows backward compatibility with `server.ssrLoadModule(url)` and `server.moduleGraph`. During build, the `client` environment is always present, and the `ssr` environment is only present if it is explicitly configured (using `environments.ssr` or for backward compatibility `build.ssr`).

```ts
interface UserConfig extends EnvironmentOptions {
  environments: Record<string, EnvironmentOptions>
  // other options
}
```

::: info

The `ssr` top level property has many options in common with `EnvironmentOptions`. This option was created for the same use case as `environments` but only allowed configuration of a small number of options. We're going to deprecate it in favour of a unified way to define environment configuration.

:::

## Custom environment instances

Low level configuration APIs are available so runtime providers can provide environments for their runtimes.

```js
import { createCustomEnvironment } from 'vite-environment-provider'

export default {
  environments: {
    client: {
      build: {
        outDir: '/dist/client',
      },
    }
    ssr: createCustomEnvironment({
      build: {
        outDir: '/dist/ssr',
      },
    }),
  },
}
```

## Backward Compatibility

The current Vite server API are not yet deprecated and are backward compatible with Vite 5. The new Environment API is experimental.

The `server.moduleGraph` returns a mixed view of the client and ssr module graphs. Backward compatible mixed module nodes will be returned from all its methods. The same scheme is used for the module nodes passed to `handleHotUpdate`.

We don't recommend switching to Environment API yet. We are aiming for a good portion of the user base to adopt Vite 6 before so plugins don't need to maintain two versions. Checkout the future breaking changes section for information on future deprecations and upgrade path:

- [`this.environment` in Hooks](/changes/this-environment-in-hooks)
- [HMR `hotUpdate` Plugin Hook](/changes/hotupdate-hook)
- [Move to per-environment APIs](/changes/per-environment-apis)
- [SSR using `ModuleRunner` API](/changes/ssr-using-modulerunner)
- [Shared plugins during build](/changes/shared-plugins-during-build)

## Target users

This guide provides the basic concepts about environments for end users.

Plugin authors have a more consistent API available to interact with the current environment configuration. If you're building on top of Vite, the [Environment API Plugins Guide](./api-environment-plugins.md) guide describes the way extended plugin APIs available to support multiple custom environments.

Frameworks could decide to expose environments at different levels. If you're a framework author, continue reading the [Environment API Frameworks Guide](./api-environment-frameworks) to learn about the Environment API programmatic side.

For Runtime providers, the [Environment API Runtimes Guide](./api-environment-runtimes.md) explains how to offer custom environment to be consumed by frameworks and users.
