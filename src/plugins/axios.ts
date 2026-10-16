/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2026-09-05 09:13:06
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-09-11 20:18:52
 * @FilePath: \haxoj\haxoj-frontend\src\plugins\axios.ts
 * @Description: 全局 axios 实例配置（请求/响应拦截器 + cookie 凭证）
 */
// Add a request interceptor
import axios from 'axios'
import { Message } from '@arco-design/web-vue'
import router from '@/router'
import { useUserStore } from '@/stores/user'

// 未登录错误码，需与后端 ErrorCode.NOT_LOGIN_ERROR 保持一致
const NOT_LOGIN_CODE = 40100

// 配置全局 axios 默认值
axios.defaults.withCredentials = true

axios.interceptors.request.use(
  function (config) {
    // 确保所有请求都携带 cookie（后端 session 登录态依赖，跨域时必须显式开启）
    config.withCredentials = true
    // Do something before request is sent
    console.log('请求', config)
    return config
  },
  function (error) {
    // Do something with request error
    console.log('请求错误', error)
    return Promise.reject(error)
  },
)

// Add a response interceptor
axios.interceptors.response.use(
  function (response) {
    console.log('响应', response)
    // 业务层「未登录」：本地登录态已失效（后端重启 / Session 过期，cookie 找不到对应会话）
    const res = response.data
    const url: string = response.config?.url || ''
    if (
      res?.code === NOT_LOGIN_CODE &&
      // get/login 本身的 40100 是路由守卫主动核对登录态的预期结果，交给 store 处理，避免跳转循环
      !url.includes('/user/get/login')
    ) {
      const userStore = useUserStore()
      // 清空失效的本地登录态（persist 插件会同步清除 localStorage）
      userStore.logout()
      Message.warning('登录状态已过期，请重新登录')
      // 避免已在登录页时重复跳转
      const currentPath = router.currentRoute.value.fullPath
      if (!currentPath.startsWith('/user/login')) {
        router.push({ path: '/user/login', query: { redirect: currentPath } })
      }
    }
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)
