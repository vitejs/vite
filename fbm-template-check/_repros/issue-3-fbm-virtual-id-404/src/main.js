// Plain JS entry — no framework. Writing into #app proves the app booted, so the
// driver can distinguish "app booted but virtual script 404'd" from "app never booted".
document.querySelector('#app').textContent = 'app booted'
window.__appBooted = true
