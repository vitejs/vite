function main() {
  self.postMessage({
    ok: true,
    location: self.location.href,
  })
}

main()
