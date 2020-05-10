export declare const hot: {
  // single dep
  accept(dep: string, cb?: (newModule: any) => void): void
  // multiple deps
  accept(deps: string[], cb?: (newModules: any[]) => void): void
  // self-accepting
  accept(cb: (newModule: any) => void): void
  // dispose
  dispose(cb: () => void): void
  // custom events
  on(event: string, cb: (data: any) => void): void
}
