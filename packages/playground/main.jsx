import { createApp } from 'vue'
import Test from './Test.vue'

createApp(Test).mount('#vue')

import React from 'react'
import ReactDOM from 'react-dom'
import App from './App.jsx'

import './hmr.js'

ReactDOM.render(
  <App/>,
  document.getElementById('react')
);
