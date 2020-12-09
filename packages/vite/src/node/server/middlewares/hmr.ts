import { NextHandleFunction } from 'connect'

export const HMR_CLIENT_PATH = `/vite/client`

export function hmr(): NextHandleFunction {
  return (req, res, next) => {
    if (req.url! === HMR_CLIENT_PATH) {
    }
  }
}
