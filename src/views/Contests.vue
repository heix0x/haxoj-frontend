<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-28 10:20:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-28 10:20:00
 * @FilePath: \haxoj-frontend\src\views\Contests.vue
 * @Description: 比赛组件
-->
<template>
  <div class="contests-container">
    <h1>比赛</h1>
    <p>这里展示所有编程竞赛</p>
  </div>
</template>

<script setup>
// 比赛组件逻辑
defineOptions({
  name: 'ContestsPage',
})
</script>

<style scoped>
.contests-container {
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
