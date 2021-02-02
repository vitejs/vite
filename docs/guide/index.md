# Getting Started

If you are interested to learn more about Vite before trying it, check out the [Introduction](./introduction) section.

## Scaffolding Your First Vite Project

::: tip Compatibility Note
Vite requires [Node.js](https://nodejs.org/en/) version >=12.0.0.
:::

With NPM:

```bash
$ npm init @vitejs/app
```

With Yarn:

```bash
$ yarn create @vitejs/app
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold a Vite + Vue project, run:

```bash
# npm 6.x
npm init @vitejs/app my-vue-app --template vue

# npm 7+, extra double-dash is needed:
npm init @vitejs/app my-vue-app -- --template vue

# yarn
yarn create @vitejs/app my-vue-app --template vue
```

Supported template presets include:

- `vanilla`
- `vue`
- `vue-ts`
- `react`
- `react-ts`
- `preact`
- `preact-ts`
- `lit-element`
- `lit-element-ts`

See [@vitejs/create-app](https://github.com/vitejs/vite/tree/main/packages/create-app) for more details on each template.

## `index.html` and Project Root

One thing you may have noticed is that in a Vite project, `index.html` is front-and-central instead of being tucked away inside `public`. This is intentional: during development Vite is a server, and `index.html` is the entry point to your application.

Vite treats `index.html` as source code and part of the module graph. It resolves `<script type="module" src="...">` that references your JavaScript source code. Even inline `<script type="module">` and CSS referenced via `<link href>` also enjoy Vite-specific features. In addition, URLs inside `index.html` are automatically rebased so there's no need for special `%PUBLIC_URL%` placeholders.

Similar to static http servers, Vite has the concept of a "root directory" from which your files are served from. You will see it referenced as `<root>` throughout the rest of the docs. Absolute URLs in your source code will be resolved using the project root as base, so you can write code as if you are working with a normal static file server (except way more powerful!). Vite is also capable of handling dependencies that resolve to out-of-root file system locations, which makes it usable even in a monorepo-based setup.

Vite also supports [multi-page apps](./build#multi-page-app) with multiple `.html` entry points.

#### Specifying Alternative Root

Running `vite` starts the dev server using the current working directory as root. You can specify an alternative root with `vite serve some/sub/dir`.

## Command Line Interface

In a project where Vite is installed, you can use the `vite` binary in your npm scripts, or run it directly with `npx vite`. Here is the default npm scripts in a scaffolded Vite project:

```json
{
  "scripts": {
    "dev": "vite",          // start dev server
    "build": "vite build",  // build for production
    "serve": "vite preview" // locally preview production build
  }
}
```

You can specify additional CLI options like `--port` or `--https`. For a full list of CLI options, run `npx vite --help` in your project.

## Using Unreleased Commits

If you can't wait for a new release to test the latest features, you will need to clone the [vite repo](https://github.com/vitejs/vite) to your local machine and then build and link it yourself ([Yarn 1.x](https://classic.yarnpkg.com/lang/en/) is required):

```bash
git clone https://github.com/vitejs/vite.git
cd vite
yarn
cd packages/vite
yarn build
yarn link
```

Then go to your vite based project and run `yarn link vite`. Now restart the development server (`yarn dev`) to ride on the bleeding edge!
