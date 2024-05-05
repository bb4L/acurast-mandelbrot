import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import inject from '@rollup/plugin-inject'
// import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
    // nodePolyfills()
    //   {
    //   include: ['buffer'],
    //   globals: {
    //     Buffer: true
    //   }
    // }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
    // },
    // build: {
    //   rollupOptions: {
    //     plugins: [inject({ Buffer: ['buffer/', 'Buffer'] })]
    //   }
  }
})
