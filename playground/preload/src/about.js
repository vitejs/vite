import { msg } from '@vitejs/test-dep-including-a'
import chunkMsg from './chunk'

document.querySelector('#about .msg').textContent = `${msg} ${chunkMsg}`
