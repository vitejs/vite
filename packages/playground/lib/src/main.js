export default function myLib(sel) {
  document.querySelector(sel).textContent = 'It works'
  document.querySelector(
    '.emitAssets-default'
  ).style.backgroundImage = `url(${new URL(
    `../../assets/nested/asset.png`,
    import.meta.url
  )})`
}
