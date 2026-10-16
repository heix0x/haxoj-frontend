<template>
  <div class="header-container">
    <div class="logo-container" @click="goToHome">
      <img src="@/assets/乌鸦人2已抠图.png" alt="HaxOJ Logo" class="logo-image" />
      <span class="logo-text">HaxOJ系统</span>
    </div>
    <a-menu mode="horizontal" :selected-keys="[activeKey]" @menu-item-click="handleMenuClick">
      <a-menu-item v-for="item in menuItems" :key="getMenuKey(item)">{{
        item.meta.title
      }}</a-menu-item>
    </a-menu>
    <div class="user-actions">
      <!-- 未登录状态 -->
      <template v-if="!userStore.userInfo.isLogin">
        <a-button type="outline" @click="router.push('/user/login')">登录</a-button>
        <a-button type="primary" @click="router.push('/user/register')">注册</a-button>
      </template>

      <!-- 已登录状态 -->
      <a-dropdown v-else trigger="hover" position="bottom">
        <div class="user-dropdown-trigger">
          <a-avatar :size="32" style="background-color: #3c7eff">
            {{ userStore.userInfo.username?.charAt(0).toUpperCase() || 'U' }}
          </a-avatar>
          <span class="username">{{ userStore.userInfo.username || '用户' }}</span>
          <IconDown />
        </div>
        <template #content>
          <a-doption @click="router.push('/user/center')">个人中心</a-doption>
          <a-doption>设置</a-doption>
          <a-doption @click="handleLogout">退出登录</a-doption>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import checkAccess from '@/access/checkAccess'
import routes from '@/router/routes'
import { IconDown } from '@arco-design/web-vue/es/icon'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 从路由配置中提取菜单项
const menuItems = computed(() => {
  // 找到根路由（包含 BasicLayout 的那个）
  const rootRoute = routes.find((item) => item.path === '/' && item.children)

  if (!rootRoute || !rootRoute.children) {
    return []
  }

  return rootRoute.children.filter((item) => {
    if (item.meta?.hideInMenu) {
      return false
    }
    // 根据权限过滤菜单
    if (!checkAccess(userStore.userInfo, item?.meta?.access)) {
      return false
    }

    return item.meta && item.meta.title
  })
})

// 获取菜单项的key
const getMenuKey = (item) => {
  // 首页特殊处理
  if (item.path === '') {
    return 'home'
  }
  return item.path
}

// 根据当前路由路径确定活跃的菜单项
const activeKey = computed(() => {
  const path = route.path

  // 找到对应的菜单项
  const currentMenu = menuItems.value.find((item) => {
    if (item.path === '') {
      return path === '/'
    }
    return path === `/${item.path}`
  })

  if (currentMenu) {
    return getMenuKey(currentMenu)
  }

  // 默认返回首页
  return 'home'
})

// 菜单项点击处理
const handleMenuClick = (key) => {
  if (key === 'home') {
    router.push('/')
  } else {
    // 对于其他路径，直接拼接
    router.push(`/${key}`)
  }
}

// 点击logo返回首页
const goToHome = () => {
  router.push('/')
}

// 退出登录
const handleLogout = () => {
  // 调用 store 的 logout 方法
  userStore.logout()
  // 跳转到首页
  router.push('/')
}
</script>

<style scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 100%;
}
.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.3s;
}
.logo-container:hover {
  opacity: 0.8;
}
.logo-image {
  height: 40px;
  margin-right: 10px;
}
.logo-text {
  font-size: 16px;
  font-weight: bold;
  color: #3f3f3f;
}
.user-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.user-dropdown-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.user-dropdown-trigger:hover {
  background-color: rgba(60, 126, 255, 0.1);
}
.username {
  margin: 0 8px;
  font-size: 14px;
  color: #333;
}
:deep(.arco-menu) {
  background-color: transparent;
  flex: 1;
  display: flex;
  justify-content: center;
}
:deep(.arco-menu-horizontal) {
  border-bottom: none;
}
:deep(.arco-menu-horizontal > .arco-menu-item) {
  color: #333;
  font-size: 16px;
  margin: 0 5px;
}
:deep(.arco-menu-horizontal > .arco-menu-item:hover) {
  color: #3c7eff;
  background-color: rgba(60, 126, 255, 0.1);
}
:deep(.arco-menu-horizontal > .arco-menu-item-active) {
  color: #3c7eff;
  font-weight: bold;
  border-bottom-color: #3c7eff;
}
:deep(.arco-btn-outline) {
  color: #333;
  border-color: #ccc;
}
:deep(.arco-btn-outline:hover) {
  border-color: #3c7eff;
  color: #3c7eff;
}
:deep(.arco-btn-primary) {
  background-color: #3c7eff;
}
</style>
