# Deploying a Static Site

The following guides are based on some shared assumptions:

- You are using the default build output location (`dist`). This location [can be changed using `build.outDir`](https://vitejs.dev/config/#build-outdir), and you can extrapolate instructions from these guides in that case.
- You are using npm. You can use equivalent commands to run the scripts if you are using Yarn or other package managers.
- Vite is installed as a local dev dependency in your project, and you have setup the following npm scripts:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

It is important to note that `vite preview` is intended for previewing the build locally and not meant as a production server.

::: tip NOTE
These guides provide instructions for performing a static deployment of your Vite site. Vite also has experimental support for Server Side Rendering. SSR refers to front-end frameworks that support running the same application in Node.js, pre-rendering it to HTML, and finally hydrating it on the client. Check out the [SSR Guide](./ssr) to learn about this feature. On the other hand, if you are looking for integration with traditional server-side frameworks, check out the [Backend Integration guide](./backend-integration) instead.
:::

## Building The App

You may run `npm run build` command to build the app.

```bash
$ npm run build
```

By default, the build output will be placed at `dist`. You may deploy this `dist` folder to any of your preferred platforms.

### Testing The App Locally

Once you've built the app, you may test it locally by running `npm run preview` command.

```bash
$ npm run build
$ npm run preview
```

The `vite preview` command will boot up local static web server that serves the files from `dist` at `http://localhost:4173`. It's an easy way to check if the production build looks OK in your local environment.

You may configure the port of the server by passing `--port` flag as an argument.

```json
{
  "scripts": {
    "preview": "vite preview --port 8080"
  }
}
```

Now the `preview` method will launch the server at `http://localhost:8080`.

## GitHub Pages

1. Set the correct `base` in `vite.config.js`.

   If you are deploying to `https://<USERNAME>.github.io/`, you can omit `base` as it defaults to `'/'`.

   If you are deploying to `https://<USERNAME>.github.io/<REPO>/`, for example your repository is at `https://github.com/<USERNAME>/<REPO>`, then set `base` to `'/<REPO>/'`.

2. Inside your project, create `deploy.sh` with the following content (with highlighted lines uncommented appropriately), and run it to deploy:

   ```bash{13,20,23}
   #!/usr/bin/env sh

   # abort on errors
   set -e

   # build
   npm run build

   # navigate into the build output directory
   cd dist

   # if you are deploying to a custom domain
   # echo 'www.example.com' > CNAME

   git init
   git checkout -b main
   git add -A
   git commit -m 'deploy'

   # if you are deploying to https://<USERNAME>.github.io
   # git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git main

   # if you are deploying to https://<USERNAME>.github.io/<REPO>
   # git push -f git@github.com:<USERNAME>/<REPO>.git main:gh-pages

   cd -
   ```

::: tip
You can also run the above script in your CI setup to enable automatic deployment on each push.
:::

### GitHub Pages and Travis CI

1. Set the correct `base` in `vite.config.js`.

   If you are deploying to `https://<USERNAME or GROUP>.github.io/`, you can omit `base` as it defaults to `'/'`.

   If you are deploying to `https://<USERNAME or GROUP>.github.io/<REPO>/`, for example your repository is at `https://github.com/<USERNAME>/<REPO>`, then set `base` to `'/<REPO>/'`.

2. Create a file named `.travis.yml` in the root of your project.

3. Run `npm install` locally and commit the generated lockfile (`package-lock.json`).

4. Use the GitHub Pages deploy provider template, and follow the [Travis CI documentation](https://docs.travis-ci.com/user/deployment/pages/).

   ```yaml
   language: node_js
   node_js:
     - lts/*
   install:
     - npm ci
   script:
     - npm run build
   deploy:
     provider: pages
     skip_cleanup: true
     local_dir: dist
     # A token generated on GitHub allowing Travis to push code on you repository.
     # Set in the Travis settings page of your repository, as a secure variable.
     github_token: $GITHUB_TOKEN
     keep_history: true
     on:
       branch: main
   ```

## GitLab Pages and GitLab CI

1. Set the correct `base` in `vite.config.js`.

   If you are deploying to `https://<USERNAME or GROUP>.gitlab.io/`, you can omit `base` as it defaults to `'/'`.

   If you are deploying to `https://<USERNAME or GROUP>.gitlab.io/<REPO>/`, for example your repository is at `https://gitlab.com/<USERNAME>/<REPO>`, then set `base` to `'/<REPO>/'`.

2. Create a file called `.gitlab-ci.yml` in the root of your project with the content below. This will build and deploy your site whenever you make changes to your content:

   ```yaml
   image: node:16.5.0
   pages:
     stage: deploy
     cache:
       key:
         files:
           - package-lock.json
         prefix: npm
       paths:
         - node_modules/
     script:
       - npm install
       - npm run build
       - cp -a dist/. public/
     artifacts:
       paths:
         - public
     rules:
       - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
   ```

## Netlify

1. Install the [Netlify CLI](https://cli.netlify.com/).
2. Create a new site using `ntl init`.
3. Deploy using `ntl deploy`.

```bash
# Install the Netlify CLI
$ npm install -g netlify-cli

# Create a new site in Netlify
$ ntl init

# Deploy to a unique preview URL
$ ntl deploy
```

The Netlify CLI will share with you a preview URL to inspect. When you are ready to go into production, use the `prod` flag:

```bash
# Deploy the site into production
$ ntl deploy --prod
```

## Google Firebase

1. Make sure you have [firebase-tools](https://www.npmjs.com/package/firebase-tools) installed.

2. Create `firebase.json` and `.firebaserc` at the root of your project with the following content:

   `firebase.json`:

   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

   `.firebaserc`:

   ```js
   {
     "projects": {
       "default": "<YOUR_FIREBASE_ID>"
     }
   }
   ```

3. After running `npm run build`, deploy using the command `firebase deploy`.

## Surge

1. First install [surge](https://www.npmjs.com/package/surge), if you haven’t already.

2. Run `npm run build`.

3. Deploy to surge by typing `surge dist`.

You can also deploy to a [custom domain](http://surge.sh/help/adding-a-custom-domain) by adding `surge dist yourdomain.com`.

## Heroku

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

2. Create a Heroku account by [signing up](https://signup.heroku.com).

3. Run `heroku login` and fill in your Heroku credentials:

   ```bash
   $ heroku login
   ```

4. Create a file called `static.json` in the root of your project with the below content:

   `static.json`:

   ```json
   {
     "root": "./dist"
   }
   ```

   This is the configuration of your site; read more at [heroku-buildpack-static](https://github.com/heroku/heroku-buildpack-static).

5. Set up your Heroku git remote:

   ```bash
   # version change
   $ git init
   $ git add .
   $ git commit -m "My site ready for deployment."

   # creates a new app with a specified name
   $ heroku apps:create example
   ```

6. Set buildpacks. We use `heroku/nodejs` to build the project and `heroku-buildpack-static` to serve it.

   ```bash
   # set buildpacks
   $ heroku buildpacks:set heroku/nodejs
   $ heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git
   ```

7. Deploy your site:

   ```bash
   # publish site
   $ git push heroku main

   # opens a browser to view the Dashboard version of Heroku CI
   $ heroku open
   ```

## Vercel

### Vercel CLI

1. Install the [Vercel CLI](https://vercel.com/cli) and run `vercel` to deploy.
2. Vercel will detect that you are using Vite and will enable the correct settings for your deployment.
3. Your application is deployed! (e.g. [vite-vue-template.vercel.app](https://vite-vue-template.vercel.app/))

```bash
$ npm i -g vercel
$ vercel init vite
Vercel CLI
> Success! Initialized "vite" example in ~/your-folder.
- To deploy, `cd vite` and run `vercel`.
```

### Vercel for Git

1. Push your code to your git repository (GitHub, GitLab, Bitbucket).
2. [Import your Vite project](https://vercel.com/new) into Vercel.
3. Vercel will detect that you are using Vite and will enable the correct settings for your deployment.
4. Your application is deployed! (e.g. [vite-vue-template.vercel.app](https://vite-vue-template.vercel.app/))

After your project has been imported and deployed, all subsequent pushes to branches will generate [Preview Deployments](https://vercel.com/docs/concepts/deployments/environments#preview), and all changes made to the Production Branch (commonly “main”) will result in a [Production Deployment](https://vercel.com/docs/concepts/deployments/environments#production).

Learn more about Vercel’s [Git Integration](https://vercel.com/docs/concepts/git).

## Azure Static Web Apps

You can quickly deploy your Vite app with Microsoft Azure [Static Web Apps](https://aka.ms/staticwebapps) service. You need:

- An Azure account and a subscription key. You can create a [free Azure account here](https://azure.microsoft.com/free).
- Your app code pushed to [GitHub](https://github.com).
- The [SWA Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps) in [Visual Studio Code](https://code.visualstudio.com).

Install the extension in VS Code and navigate to your app root. Open the Static Web Apps extension, sign in to Azure, and click the '+' sign to create a new Static Web App. You will be prompted to designate which subscription key to use.

Follow the wizard started by the extension to give your app a name, choose a framework preset, and designate the app root (usually `/`) and built file location `/dist`. The wizard will run and will create a GitHub action in your repo in a `.github` folder.

The action will work to deploy your app (watch its progress in your repo's Actions tab) and, when successfully completed, you can view your app in the address provided in the extension's progress window by clicking the 'Browse Website' button that appears when the GitHub action has run.
