/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-28 11:00:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-09-04 17:19:05
 * @FilePath: \haxoj-frontend\src\stores\user.js
 * @Description: 用户状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { UserControllerService } from '@/api'
import ACCESS_ENUM from '@/access/accessEnum'

// 初始用户信息（工厂函数：每次返回全新对象）
// 注意：不能用共享的常量对象！ref() 不会拷贝对象，且持久化恢复($patch)是深合并，
// 二者都会就地把旧数据(如残留的 admin)写进默认值对象，导致"重置为默认值"失效
const createDefaultUserInfo = () => ({
  isLogin: false,
  username: '',
  userRole: '', // guest, user, admin
  avatar: '',
})

// 定义用户状态管理
export const useUserStore = defineStore(
  'user',
  () => {
    // 用户信息
    const userInfo = ref(createDefaultUserInfo())

    // 登录方法
    function login(username: string, userRole = ACCESS_ENUM.USER) {
      userInfo.value = {
        isLogin: true,
        username,
        userRole,
        avatar: '', // 可以设置默认头像
      }
    }

    // 退出登录
    function logout() {
      userInfo.value = createDefaultUserInfo()
    }

    // 更新用户信息
    function updateUserInfo(info: any) {
      userInfo.value = {
        ...userInfo.value,
        ...info,
      }
    }

    // 获取远程登录信息（从后端获取当前登录用户）
    async function getLoginUser() {
      try {
        // 调用后端 API 获取当前登录用户信息
        const res = await UserControllerService.getLoginUserUsingGet()
        console.log('获取登录用户信息响应:', res)

        // 判断是否成功（code === 0 表示成功）
        if (res.code === 0 && res.data) {
          // 成功：更新用户信息为后端返回的数据
          userInfo.value = {
            isLogin: true,
            username: res.data.userName || '',
            userRole: res.data.userRole || ACCESS_ENUM.USER,
            avatar: res.data.userAvatar || '',
          }
          console.log('用户信息已更新:', userInfo.value)
        } else {
          // 失败：完整重置为未登录状态，避免残留的本地缓存（如 admin 角色）继续生效
          userInfo.value = createDefaultUserInfo()
          console.log('获取用户信息失败，已重置为未登录状态')
        }
      } catch (error) {
        // 请求出错，也完整重置为未登录状态
        console.error('获取登录用户信息失败', error)
        userInfo.value = createDefaultUserInfo()
      }
    }

    return {
      userInfo,
      login,
      logout,
      updateUserInfo,
      getLoginUser,
    }
  },
  {
    // 使用pinia内置的持久化功能
    persist: {
      key: 'haxoj-user',
      storage: localStorage,
      pick: ['userInfo'], // 仅持久化userInfo
    },
  },
)
