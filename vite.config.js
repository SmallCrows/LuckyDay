import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate', // 自动更新 Service Worker
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '幸运日',
        short_name: '幸运日',
        description: '查看日历今天是否是你的幸运日',
        theme_color: '#f5f5f7', // 这里的颜色建议与你 App 的背景色一致
        background_color: '#ffffff',
        display: 'standalone',  // 核心：让应用独立运行，不显示浏览器地址栏
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})