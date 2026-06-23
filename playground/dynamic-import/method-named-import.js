// Regression: methods/shorthands named `import` must not be rewritten as dynamic imports.
export class Repo {
  async import(keys, values) {
    return `${keys},${values}`
  }
}

export const repoLike = {
  import(a, b) {
    return `${a},${b}`
  },
}

// comment between params and body
export class Commented {
  import(a, b) /* note */ {
    return `${a},${b}`
  }
}

new Repo().import('a', 'b').then((classResult) => {
  document.querySelector('.method-named-import').textContent =
    `${classResult} ${repoLike.import('c', 'd')} ${new Commented().import('e', 'f')}`
})
