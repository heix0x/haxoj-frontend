/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-27 13:34:19
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-28 09:56:42
 * @FilePath: \haxoj-frontend\src\router\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useUserStore } from '@/stores/user'
import ACCESS_ENUM from '@/access/accessEnum'
import checkAccess from '@/access/checkAccess'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - HaxOJ系统` : 'HaxOJ系统'

  const userStore = useUserStore()
  const loginUser = userStore.userInfo

  console.log('路由守卫 - 登陆用户信息:', loginUser)

  // 如果之前没登陆过，自动登录
  if (!loginUser || !loginUser.userRole) {
    console.log('路由守卫 - 未登录或无用户角色，准备获取用户信息...')
    // 加 await 是为了等用户登录成功之后，再执行后续的代码
    await userStore.getLoginUser()
    console.log('路由守卫 - 获取用户信息后:', userStore.userInfo)
  }

  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN

  // 要跳转的页面必须要登陆
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    // 如果没登陆，跳转到登录页面
    if (!loginUser || !loginUser.userRole) {
      console.log('路由守卫 - 需要登录但未登录，跳转到登录页')
      next(`/user/login?redirect=${to.fullPath}`)
      return
    }

    // 如果已经登陆了，但是权限不足，那么跳转到无权限页面
    if (!checkAccess(loginUser, needAccess)) {
      console.log('路由守卫 - 权限不足，跳转到无权限页')
      next('/noAuth')
      return
    }
  }

  console.log('路由守卫 - 允许访问页面:', to.path)
  next()
})

export default router
