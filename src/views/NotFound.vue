<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-28 10:30:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-28 10:30:00
 * @FilePath: \haxoj-frontend\src\views\NotFound.vue
 * @Description: 404页面组件
-->
<template>
  <div class="not-found-container">
    <img src="@/assets/乌鸦人2已抠图.png" alt="404" class="not-found-image" />
    <h1>404</h1>
    <p>抱歉，您访问的页面不存在</p>
    <a-button type="primary" @click="goHome">返回首页</a-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found-container {
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.not-found-image {
  width: 120px;
  opacity: 0.6;
  margin-bottom: 20px;
}

h1 {
  font-size: 72px;
  margin: 0;
  color: #1d2129;
  line-height: 1;
}

p {
  font-size: 18px;
  color: #4e5969;
  margin: 20px 0 32px;
}
</style>
