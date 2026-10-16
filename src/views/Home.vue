<!--
 * @Description: 首页
-->
<template>
  <div class="home-container">
    <h1>欢迎使用HaxOJ系统</h1>
    <p>这是一个在线代码评测系统</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'Home',
})
</script>

<style scoped>
.home-container {
  padding: 20px;
}

h1 {
  font-size: 28px;
  margin-bottom: 16px;
  color: #1d2129;
}

p {
  font-size: 16px;
  color: #4e5969;
}
</style>
