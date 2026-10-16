<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 登录状态的校验统一放在路由守卫中（router/index.ts）：
// 每次刷新页面后的第一次导航都会 await 后端校验，页面渲染前就能拿到真实身份，
// 避免本地缓存中的旧权限（如 admin）造成菜单闪现
/**
 * 全局初始化函数，有全局单次调用的代码，都可以写到这里
 */
import { onMounted } from 'vue'

const doInit = () => {
  console.log('hello 欢迎来到我的项目')
}

onMounted(() => {
  doInit()
})
</script>

<style scoped></style>
