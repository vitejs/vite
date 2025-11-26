// main.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// App.jsx
import { useState } from 'react'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profil" element={<Profile />} />
            <Route path="/bank-soal" element={<BankSoal />} />
            <Route path="/nilai" element={<DashboardNilai />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function Navbar() {
  return (
    <nav className="w-full bg-white shadow p-4 flex justify-between items-center mb-6 rounded-2xl">
      <h1 className="text-2xl font-bold">Website Sekolah</h1>
      <ul className="flex gap-6 text-lg">
        <li><Link to="/" className="hover:underline">Beranda</Link></li>
        <li><Link to="/profil" className="hover:underline">Profil</Link></li>
        <li><Link to="/bank-soal" className="hover:underline">Bank Soal</Link></li>
        <li><Link to="/nilai" className="hover:underline">Nilai</Link></li>
      </ul>
    </nav>
  )
}

function Home() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Beranda</h2>
      <p>Selamat datang di website sekolah modern.</p>
    </section>
  )
}

function Profile() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Profil Sekolah</h2>
      <p>Isi profil sekolah bisa ditampilkan di sini.</p>
    </section>
  )
}

function BankSoal() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Bank Soal</h2>
      <p>Koleksi soal-soal bisa diupload atau ditampilkan di sini.</p>
    </section>
  )
}

function DashboardNilai() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Dashboard Nilai</h2>
      <FormNilai />
      <TabelNilai />
    </section>
  )
}

function FormNilai() {
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">Input Nilai Siswa</h3>
      <form className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="p-3 border rounded-xl" placeholder="Nama Siswa" />
        <input className="p-3 border rounded-xl" placeholder="Mata Pelajaran" />
        <input className="p-3 border rounded-xl" placeholder="Nilai" type="number" />
        <button className="col-span-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">Simpan</button>
      </form>
    </div>
  )
}

function TabelNilai() {
  return (
    <div className="overflow-x-auto">
      <h3 className="font-semibold mb-2">Daftar Nilai</h3>
      <table className="w-full bg-white border rounded-xl">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-3 border">Nama</th>
            <th className="p-3 border">Mapel</th>
            <th className="p-3 border">Nilai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 border">contoh siswa</td>
            <td className="p-3 border">Matematika</td>
            <td className="p-3 border">90</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
function Navbar() {
  return (
    <nav className="w-full bg-white shadow p-4 flex justify-between items-center mb-6 rounded-2xl">
      <h1 className="text-2xl font-bold">Website Sekolah</h1>
      <ul className="flex gap-6 text-lg">
        <li className="hover:underline cursor-pointer">Beranda</li>
        <li className="hover:underline cursor-pointer">Profil</li>
        <li className="hover:underline cursor-pointer">Bank Soal</li>
        <li className="hover:underline cursor-pointer">Nilai</li>
      </ul>
    </nav>
  )
}

function Home() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Beranda</h2>
      <p>Selamat datang di website sekolah modern.</p>
    </section>
  )
}

function Profile() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Profil Sekolah</h2>
      <p>Isi profil sekolah bisa ditampilkan di sini.</p>
    </section>
  )
}

function BankSoal() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Bank Soal</h2>
      <p>Koleksi soal-soal bisa diupload atau ditampilkan di sini.</p>
    </section>
  )
}

function DashboardNilai() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-2">Dashboard Nilai</h2>
      <p>Data nilai siswa akan muncul di bagian ini.</p>
    </section>
  )
}
        className="px-6 py-3 rounded-2xl shadow bg-white hover:shadow-lg transition"
      >
        Klik: {count}
      </button>
    </div>
  )
}

// index.css
@tailwind base;
@tailwind components;
@tailwind utilities;


// === LOCAL DATABASE (IndexedDB via idb) ===
// Note: This is a simple local DB to store nilai offline.
import { openDB } from 'idb';

const dbPromise = openDB('sekolahDB', 1, {
  upgrade(db) {
    db.createObjectStore('nilai', { keyPath: 'id', autoIncrement: true });
  },
});

async function simpanNilaiDB(data) {
  const db = await dbPromise;
  await db.add('nilai', data);
}

async function ambilNilaiDB() {
  const db = await dbPromise;
  return await db.getAll('nilai');
}

// === LOGIN SISTEM ===
function Login() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-2xl shadow max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Login Pengguna</h2>
        <input className="w-full p-3 border rounded-xl mb-3" placeholder="Username" />
        <input type="password" className="w-full p-3 border rounded-xl mb-3" placeholder="Password" />
        <button className="w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">Masuk</button>
      </div>
    </div>
  );
}

// === HERO BANNER ===
function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-10 rounded-2xl mb-10 shadow-xl">
      <h1 className="text-4xl font-bold mb-2">SDN 03 Kejene</h1>
      <p className="text-lg">Semangat • Aktif • Jujur • Agamis</p>
    </div>
  );
}

// === UPLOAD BANK SOAL ===
function UploadSoal() {
  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Upload Bank Soal</h2>
      <input type="file" className="p-3 border rounded-xl mb-3 w-full" />
      <button className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition w-full">Upload</button>
    </section>
  );
}

// === GRAFIK NILAI (Recharts) ===
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

function GrafikNilai() {
  const data = [
    { nama: 'Ani', nilai: 90 },
    { nama: 'Budi', nilai: 85 },
    { nama: 'Cici', nilai: 95 },
  ];

  return (
    <section className="mb-10 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Grafik Nilai Siswa</h2>
      <LineChart width={600} height={300} data={data}>
        <Line type="monotone" dataKey="nilai" stroke="#000" />
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="nama" />
        <YAxis />
        <Tooltip />
      </LineChart>
    </section>
  );
}
---
title: Configuring Vite
---

# Configuring Vite

When running `vite` from the command line, Vite will automatically try to resolve a config file named `vite.config.js` inside [project root](/guide/#index-html-and-project-root) (other JS and TS extensions are also supported).

The most basic config file looks like this:

```js [vite.config.js]
export default {
  // config options
}
```

Note Vite supports using ES modules syntax in the config file even if the project is not using native Node ESM, e.g. `"type": "module"` in `package.json`. In this case, the config file is auto pre-processed before load.

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```bash
vite --config my-config.js
```

::: tip CONFIG LOADING
By default, Vite uses `esbuild` to bundle the config into a temporary file and load it. This may cause issues when importing TypeScript files in a monorepo. If you encounter any issues with this approach, you can specify `--configLoader runner` to use the [module runner](/guide/api-environment-runtimes.html#modulerunner) instead, which will not create a temporary config and will transform any files on the fly. Note that module runner doesn't support CJS in config files, but external CJS packages should work as usual.

Alternatively, if you're using an environment that supports TypeScript (e.g. `node --experimental-strip-types`), or if you're only writing plain JavaScript, you can specify `--configLoader native` to use the environment's native runtime to load the config file. Note that updates to modules imported by the config file are not detected and hence would not auto-restart the Vite server.
:::

## Config Intellisense

Since Vite ships with TypeScript typings, you can leverage your IDE's intellisense with jsdoc type hints:

```js
/** @type {import('vite').UserConfig} */
export default {
  // ...
}
```

Alternatively, you can use the `defineConfig` helper which should provide intellisense without the need for jsdoc annotations:

```js
import { defineConfig } from 'vite'

export default defineConfig({
  // ...
})
```

Vite also supports TypeScript config files. You can use `vite.config.ts` with the `defineConfig` helper function above, or with the `satisfies` operator:

```ts
import type { UserConfig } from 'vite'

export default {
  // ...
} satisfies UserConfig
```

## Conditional Config

If the config needs to conditionally determine options based on the command (`serve` or `build`), the [mode](/guide/env-and-mode#modes) being used, if it's an SSR build (`isSsrBuild`), or is previewing the build (`isPreview`), it can export a function instead:

```js twoslash
import { defineConfig } from 'vite'
// ---cut---
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (command === 'serve') {
    return {
      // dev specific config
    }
  } else {
    // command === 'build'
    return {
      // build specific config
    }
  }
})
```

It is important to note that in Vite's API the `command` value is `serve` during dev (in the cli [`vite`](/guide/cli#vite), `vite dev`, and `vite serve` are aliases), and `build` when building for production ([`vite build`](/guide/cli#vite-build)).

`isSsrBuild` and `isPreview` are additional optional flags to differentiate the kind of `build` and `serve` commands respectively. Some tools that load the Vite config may not support these flags and will pass `undefined` instead. Hence, it's recommended to use explicit comparison against `true` and `false`.

## Async Config

If the config needs to call async functions, it can export an async function instead. And this async function can also be passed through `defineConfig` for improved intellisense support:

```js twoslash
import { defineConfig } from 'vite'
// ---cut---
export default defineConfig(async ({ command, mode }) => {
  const data = await asyncFunction()
  return {
    // vite config
  }
})
```

## Using Environment Variables in Config

Environment variables available while the config itself is being evaluated are only those that already exist in the current process environment (`process.env`). Vite deliberately defers loading any `.env*` files until _after_ the user config has been resolved because the set of files to load depends on config options like [`root`](/guide/#index-html-and-project-root) and [`envDir`](/config/shared-options.md#envdir), and also on the final `mode`.

This means: variables defined in `.env`, `.env.local`, `.env.[mode]`, or `.env.[mode].local` are **not** automatically injected into `process.env` while your `vite.config.*` is running. They _are_ automatically loaded later and exposed to application code via `import.meta.env` (with the default `VITE_` prefix filter) exactly as documented in [Env Variables and Modes](/guide/env-and-mode.html). So if you only need to pass values from `.env*` files to the app, you don't need to call anything in the config.

If, however, values from `.env*` files must influence the config itself (for example to set `server.port`, conditionally enable plugins, or compute `define` replacements), you can load them manually using the exported [`loadEnv`](/guide/api-javascript.html#loadenv) helper.

```js twoslash
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the
  // `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      // Provide an explicit app-level constant derived from an env var.
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    // Example: use an env var to set the dev server port conditionally.
    server: {
      port: env.APP_PORT ? Number(env.APP_PORT) : 5173,
    },
  }
})
```

## Debugging the Config File on VS Code

With the default `--configLoader bundle` behavior, Vite writes the generated temporary configuration file to the `node_modules/.vite-temp` folder and a file not found error will occur when setting breakpoint debugging in the Vite config file. To fix the issue, add the following configuration to `.vscode/settings.json`:

```json
{
  "debug.javascript.terminalOptions": {
    "resolveSourceMapLocations": [
      "${workspaceFolder}/**",
      "!**/node_modules/**",
      "**/node_modules/.vite-temp/**"
    ]
  }
}
```
