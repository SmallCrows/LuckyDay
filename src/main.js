import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// 插件会自动注入虚幻模块来实现注册
import { registerSW } from 'virtual:pwa-register'

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
