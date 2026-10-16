<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-28 10:20:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-28 09:54:02
 * @FilePath: \haxoj-frontend\src\views\Problems.vue
 * @Description: 题库组件
-->
<template>
  <div class="problems-container">
    <h1>题库</h1>
    <p>这里展示所有可用的编程题目</p>
  </div>
</template>

<script setup>
// 题库组件逻辑
defineOptions({
  name: 'ProblemsPage',
})
</script>

<style scoped>
.problems-container {
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #1d2129;
}

p {
  font-size: 16px;
  color: #4e5969;
}
</style>
