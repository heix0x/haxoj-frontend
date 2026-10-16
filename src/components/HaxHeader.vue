<template>
  <div class="header-container">
    <div class="logo-container" @click="goToHome">
      <img src="@/assets/乌鸦人2已抠图.png" alt="HaxOJ Logo" class="logo-image" />
      <span class="logo-text">HaxOJ系统</span>
    </div>
    <!--
      顶栏菜单：
      - 普通项直接是 a-menu-item
      - 带子路由的项（如"管理员中心"）用 a-sub-menu，横向模式下鼠标悬停即可展开下拉
      注意：a-sub-menu / a-menu-item 的 key 必须写在组件上（Arco 通过 vnode.key 识别菜单项）
    -->
    <a-menu mode="horizontal" :selected-keys="selectedKeys" @menu-item-click="handleMenuClick">
      <a-menu-item v-for="item in normalMenuItems" :key="getMenuKey(item)">
        {{ item.meta.title }}
      </a-menu-item>
      <a-sub-menu v-for="item in subMenuItems" :key="getMenuKey(item)">
        <template #title>{{ item.meta.title }}</template>
        <a-menu-item v-for="child in getVisibleChildren(item)" :key="getChildKey(item, child)">
          {{ child.meta.title }}
        </a-menu-item>
      </a-sub-menu>
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
import ACCESS_ENUM from '@/access/accessEnum'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 三秒后将用户的权限改为管理员
// setTimeout(() => {
//   userStore.userInfo.userRole = ACCESS_ENUM.ADMIN
// }, 3000)

// 菜单项（只取菜单用得到的字段）
interface MenuRoute {
  path: string
  meta?: {
    title?: string
    access?: string
    hideInMenu?: boolean
    activeMenu?: string
  }
  children?: MenuRoute[]
}

// 从路由配置中提取菜单项（根路由带 children 的那个即主布局菜单）
const menuItems = computed<MenuRoute[]>(() => {
  const rootRoute = routes.find((item) => item.path === '/' && item.children) as unknown as
    | MenuRoute
    | undefined

  if (!rootRoute?.children) {
    return []
  }

  return rootRoute.children.filter((item) => {
    // 不在菜单展示
    if (item.meta?.hideInMenu) {
      return false
    }
    // 无标题不成菜单
    if (!item.meta?.title) {
      return false
    }
    // 根据权限过滤菜单
    return checkAccess(userStore.userInfo, item.meta?.access as any)
  })
})

// 拆成两组渲染：普通菜单项 / 带下拉的菜单项
// （不用 <template v-for> 包一层，否则 v-for 的 key 会落到 Fragment 上，Arco 就取不到 key 了）
const normalMenuItems = computed(() => menuItems.value.filter((item) => !item.children?.length))
const subMenuItems = computed(() => menuItems.value.filter((item) => item.children?.length))

// 获取菜单项的key
const getMenuKey = (item: MenuRoute) => {
  // 首页特殊处理
  if (item.path === '') {
    return 'home'
  }
  return item.path
}

// 子菜单项的 key = 父路径 + 子路径，如 admin/questions
const getChildKey = (parent: MenuRoute, child: MenuRoute) => `${getMenuKey(parent)}/${child.path}`

// 子菜单可见项：未 hideInMenu、有标题、权限足够（子路由未单独声明 access 时继承父级）
const getVisibleChildren = (parent: MenuRoute) => {
  return (parent.children || []).filter((child) => {
    if (child.meta?.hideInMenu) {
      return false
    }
    if (!child.meta?.title) {
      return false
    }
    return checkAccess(userStore.userInfo, (child.meta?.access ?? parent.meta?.access) as any)
  })
}

// 根据当前路由路径确定活跃的菜单项
const activeKey = computed(() => {
  // 隐藏页面（如"创建题目"）通过 meta.activeMenu 指定高亮的菜单项
  if (route.meta?.activeMenu) {
    return route.meta.activeMenu
  }

  const path = route.path

  for (const item of menuItems.value) {
    const key = getMenuKey(item)
    const basePath = item.path === '' ? '/' : `/${item.path}`

    // 命中菜单项本身（如 /admin 或 /problems）
    if (path === basePath) {
      return key
    }

    // 命中子页面（如 /admin/users、/admin/questions/create）→ 高亮对应子项
    if (item.children?.length) {
      const child = getVisibleChildren(item).find((subItem) => {
        const subPath = `${basePath}/${subItem.path}`
        return path === subPath || path.startsWith(`${subPath}/`)
      })
      if (child) {
        return getChildKey(item, child)
      }
    }
  }

  // 默认返回首页
  return 'home'
})

// 当前高亮的菜单 key 列表
const selectedKeys = computed(() => [activeKey.value])

// 菜单项点击处理
const handleMenuClick = (key) => {
  if (key === 'home') {
    router.push('/')
  } else {
    // key 就是路由路径（子菜单项为 admin/questions 这类组合路径）
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
/* 带下拉的菜单项（如"管理员中心"）：横向模式下 Arco 会渲染成 pop 形式 */
:deep(.arco-menu-horizontal .arco-menu-pop-header) {
  color: #333;
  font-size: 16px;
  margin: 0 5px;
}
:deep(.arco-menu-horizontal .arco-menu-pop-header:hover) {
  color: #3c7eff;
  background-color: rgba(60, 126, 255, 0.1);
}
/* 子项被选中时父级高亮（Arco 会给 header 加 arco-menu-selected） */
:deep(.arco-menu-horizontal .arco-menu-pop-header.arco-menu-selected) {
  color: #3c7eff;
  font-weight: bold;
}
/* 下拉面板里的子菜单项 */
:deep(.arco-menu-pop-trigger-menu .arco-menu-item) {
  font-size: 14px;
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
