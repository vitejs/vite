# Getting Started

If you are interested to learn more about Vite before trying it, check out the [Introduction](./introduction) section.

## Scaffolding Your First Vite Project

::: tip Comaptibility Note
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
npm init @vitejs/app my-vue-app --template vue
```

Supported template presets include:

- `vue`
- `vue-ts`
- `react`
- `react-ts`
- `preact`
- `preact-ts`
- `reason-react`

See [@vitejs/create-app](https://github.com/vitejs/vite/tree/main/packages/create-app) for more details on each template.

## Command Line Interface

In a project where Vite is installed, you can use the `vite` binary in your npm scripts, or run it directly with `npx vite`. Here is the default npm scripts in a scaffolded Vite project:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

You can specify additional CLI options like `--port` or `--https`. For a full list of CLI options, run `npx vite --help` in your project.

## Project Root

Since Vite is a dev server, it has the concept of a "root directory" from which your files are served from, similar to a static file server (although much more powerful).

Running `vite` starts the dev server using the current working direcotry as root. You can specify an alternative root with `vite serve some/sub/dir`.

Vite will serve **`<root>/index.html`** when you open the server's local address. It is also used as the default build entry point. Unlike some bundlers that treat HTML as an afterthought, Vite treats HTML files as part of the application graph (similar to Parcel). Therefore you should treat `index.html` as part of your source code instead of a static file. Vite also supports [multi-page apps](./build#multi-page-app) with multiple `.html` entry points.

Vite will automatically pick up **`<root>/vite.config.js`** if there is one. You can also explicitly specify a config file to use via the `--config <file>` CLI option.

Unlike a static file server, Vite can actually resolve and serve dependencies located anywhere on your file system, even if they are out of the project root. This allows Vite to work properly inside a sub package of a monorepo.

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
