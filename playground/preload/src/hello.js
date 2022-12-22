import style from './hello.module.css'

const msg = document.querySelector('#hello .msg')
msg.textContent = 'hello'
msg.classList.add(style.h1)
