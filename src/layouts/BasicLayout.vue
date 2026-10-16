<template>
  <a-layout class="layout-container">
    <a-layout-header>
      <HaxHeader />
    </a-layout-header>
    <a-layout-content class="layout-content">
      <!-- 路由出口 -->
      <router-view></router-view>
    </a-layout-content>
    <a-layout-footer class="layout-footer">
      hax学习OJ
      <a href="https://www.haxnook.top">hax</a>
    </a-layout-footer>
  </a-layout>
</template>

<script setup lang="ts">
import HaxHeader from '@/components/HaxHeader.vue'
</script>

<style>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.arco-layout-header {
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  position: relative;
}

.layout-content {
  padding: 24px;
  /* 将背景色改成渐变色 */
  background: linear-gradient(135deg, #f5f5f5, #d3d3d3, #a9a9a9);
  flex: 1;
  overflow: auto;
  padding-bottom: 100px; /* 为底部腾出空间 */
}

.layout-footer {
  text-align: center;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #e8e8e8;
  color: #86909c;
}
</style>
