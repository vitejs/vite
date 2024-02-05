function main() {
  import.meta.env.VITE_NOT_EXIST
  console.log('hello') // browser devtools should show "repro.ts:3"
}

main()
