import axios from 'axios'

// 配置全局 axios 默认值
axios.defaults.withCredentials = true

axios.interceptors.request.use(
  function (config) {
    // 确保所有请求都携带 cookie
    config.withCredentials = true
    console.log('请求', config)
    return config
  },
  function (error) {
    // 对请求错误做些什么
    console.log('请求错误', error)
    return Promise.reject(error)
  },
)

axios.interceptors.response.use(
  function (response) {
    console.log('响应', response)
    return response
  },
  function (error) {
    return Promise.reject(error)
  },
)

export default axios
