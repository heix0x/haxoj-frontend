<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-28 10:30:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-28 10:30:00
 * @FilePath: \haxoj-frontend\src\views\About.vue
 * @Description: 关于页面组件
-->
<template>
  <div class="about-container">
    <h1>关于我们</h1>
    <p>HaxOJ是一个在线代码评测系统，专为编程学习和竞赛设计。</p>
    <div class="about-info">
      <h2>联系我们</h2>
      <p>邮箱：hax@example.com</p>
      <p>网站：<a href="https://www.haxnook.top" target="_blank">https://www.haxnook.top</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 关于页面组件逻辑
defineOptions({
  name: 'AboutPage',
})
</script>

<style scoped>
.about-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #1d2129;
}

h2 {
  font-size: 20px;
  margin: 20px 0 12px;
  color: #1d2129;
}

p {
  font-size: 16px;
  color: #4e5969;
  line-height: 1.6;
  margin-bottom: 12px;
}

.about-info {
  margin-top: 32px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

a {
  color: #3c7eff;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
