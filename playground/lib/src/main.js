export default function myLib(sel) {
  // Force esbuild spread helpers (https://github.com/evanw/esbuild/issues/951)
  console.log({ ...'foo' })

  document.querySelector(sel).textContent = 'It works'
}

// Env vars should not be replaced
export const processNodeEnv = process.env.NODE_ENV
export const importMetaEnv = import.meta.env
