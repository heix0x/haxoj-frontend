<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

const doInit = () => {
  console.log('hello 欢迎来到我的项目')
}

onMounted(() => {
  doInit()
})
</script>

<style scoped></style>
