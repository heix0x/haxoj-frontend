/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-27 13:34:19
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-05-13 09:54:08
 * @FilePath: \haxoj-frontend\src\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'

import App from './App.vue'
import router from './router'

import './api/core/axiosInterceptors'

// 创建pinia实例并使用持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(ArcoVue)
app.use(pinia)
app.use(router)

app.mount('#app')
