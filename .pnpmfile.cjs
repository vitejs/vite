function readPackage(pkg) {
  // force vue-template-compiler to have vue as deps
  // is prevent conflicts from vue2 and vue3
  if (pkg.name === 'vue-template-compiler') {
    pkg.dependencies = {
      ...pkg.dependencies,
      vue: pkg.version
    }
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
