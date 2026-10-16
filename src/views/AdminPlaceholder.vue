<!--
 * @Description: 管理后台占位页（比赛管理 /admin/contests、系统设置 /admin/settings）
 * 这两个模块后端暂未实现，先用占位页保证路由可访问，后续再替换为真实页面。
-->
<template>
  <div class="admin-placeholder">
    <a-card :bordered="false" class="placeholder-card">
      <a-result status="info" :title="pageTitle" subtitle="该功能正在开发中，敬请期待。">
        <template #extra>
          <a-space>
            <a-button type="primary" @click="router.push('/admin/overview')">
              返回概览
            </a-button>
            <a-button @click="router.back()">返回上一页</a-button>
          </a-space>
        </template>
      </a-result>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({
  name: 'AdminPlaceholder',
})

const route = useRoute()
const router = useRouter()

// 标题直接取路由 meta.title，同一个组件复用于「比赛管理」「系统设置」
const pageTitle = computed(() => (route.meta.title as string) || '功能开发中')
</script>

<style scoped>
.admin-placeholder {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.placeholder-card {
  background-color: #fff;
  border-radius: 8px;
}
</style>
