/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-05-13 10:15:34
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-09-11 19:58:18
 * @FilePath: \haxoj\haxoj-frontend\src\router\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * 路由实例 + 全局权限守卫
 * 职责：
 *  - 菜单已按角色过滤（见 HaxHeader.vue），守卫负责兜底「URL 直达」场景：
 *    1) 访问需要登录的页面但未登录 → 跳登录页（携带 redirect，登录后回跳）
 *    2) 已登录但角色不足（如普通用户访问管理员页）→ 跳无权限页
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

// 本次 SPA 运行期间是否已向后端核对过登录态
// localStorage 持久化的登录态可能与后端不一致（后端重启 / Session 过期后 cookie 失效），
// 因此首次进入需要权限的页面时，无论本地状态如何，都向后端确认一次
let hasFetchedLoginUser = false

router.beforeEach(async (to) => {
  // 同步浏览器标签页标题
  document.title = to.meta?.title ? `${to.meta.title} - HaxOJ系统` : 'HaxOJ系统'

  // meta.access 缺省视为 NOT_LOGIN（公共页面），直接放行
  const needAccess = to.meta?.access ?? ACCESS_ENUM.NOT_LOGIN

  const userStore = useUserStore()

  // 首次进入受保护页面：用后端真实 Session 校正本地（可能已失效的）持久化登录态
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN && !hasFetchedLoginUser) {
    hasFetchedLoginUser = true
    await userStore.getLoginUser()
  }

  if (needAccess === ACCESS_ENUM.NOT_LOGIN) {
    return true
  }

  // 权限足够，放行
  if (checkAccess(userStore.userInfo, needAccess)) {
    return true
  }

  // 需要登录但未登录 → 去登录页，登录后回跳原页面
  if (!userStore.userInfo.isLogin) {
    return {
      path: '/user/login',
      query: { redirect: to.fullPath },
    }
  }

  // 已登录但角色不足 → 无权限页
  return { path: '/noAuth', query: { redirect: to.fullPath } }
})

export default router
