<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2026-05-23 16:31:53
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-05-23 16:32:14
 * @FilePath: \haxoj\haxoj-frontend\src\views\NoAuth.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="no-auth-container">
    <div class="no-auth-content">
      <div class="icon-wrapper">
        <a-icon type="warning" :size="80" color="#ff9800" />
      </div>
      <h1 class="title">权限不足</h1>
      <p class="description">抱歉，您没有访问该页面的权限</p>
      <div class="actions">
        <a-button type="primary" @click="goBack">返回上一页</a-button>
        <a-button @click="goHome">返回首页</a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.no-auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.no-auth-content {
  text-align: center;
  padding: 60px 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
  margin-bottom: 24px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.description {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.actions :deep(.arco-btn) {
  padding: 12px 32px;
  font-size: 14px;
}
</style>
