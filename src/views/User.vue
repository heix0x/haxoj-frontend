<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-30 11:00:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-30 11:00:00
 * @FilePath: \haxoj-frontend\src\views\User.vue
 * @Description: 用户中心页面
-->
<template>
  <div class="user-container">
    <a-card class="user-card">
      <template #title>
        <div class="card-title"><icon-user /> 用户信息</div>
      </template>
      <a-descriptions :data="userInfo" layout="inline-vertical" />
    </a-card>

    <a-card class="submission-card">
      <template #title>
        <div class="card-title"><icon-code /> 提交记录</div>
      </template>
      <a-table :columns="columns" :data="submissions" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IconUser, IconCode } from '@arco-design/web-vue/es/icon'

// 模拟用户数据
const userInfo = [
  {
    label: '用户名',
    value: 'hax',
  },
  {
    label: '邮箱',
    value: '3152409286@qq.com',
  },
  {
    label: '注册时间',
    value: '2025-04-30',
  },
  {
    label: '解题数',
    value: '42',
  },
]

// 表格列定义
const columns = [
  {
    title: '题目',
    dataIndex: 'problem',
  },
  {
    title: '提交时间',
    dataIndex: 'submitTime',
  },
  {
    title: '语言',
    dataIndex: 'language',
  },
  {
    title: '状态',
    dataIndex: 'status',
  },
]

// 模拟提交记录数据
const submissions = ref([
  {
    problem: 'A + B 问题',
    submitTime: '2025-04-30 10:00:00',
    language: 'Python3',
    status: '通过',
  },
  {
    problem: '两数之和',
    submitTime: '2025-04-30 09:30:00',
    language: 'Java',
    status: '编译错误',
  },
])
</script>

<style scoped>
.user-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-card,
.submission-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}
</style>
