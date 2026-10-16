<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-04-30 11:00:00
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2025-04-30 11:00:00
 * @FilePath: \haxoj-frontend\src\views\Admin.vue
 * @Description: 管理员中心页面
-->
<template>
  <div class="admin-container">
    <a-row :gutter="16">
      <a-col :span="6">
        <a-menu
          :selected-keys="[selectedKey]"
          @menu-item-click="handleMenuClick"
          style="height: 100%"
        >
          <a-menu-item key="users"> <icon-user /> 用户管理 </a-menu-item>
          <a-menu-item key="problems"> <icon-code /> 题目管理 </a-menu-item>
          <a-menu-item key="contests"> <icon-calendar /> 比赛管理 </a-menu-item>
          <a-menu-item key="settings"> <icon-settings /> 系统设置 </a-menu-item>
        </a-menu>
      </a-col>
      <a-col :span="18">
        <div class="content-panel">
          <!-- 用户管理面板 -->
          <div v-if="selectedKey === 'users'">
            <h3>用户管理</h3>
            <a-table :columns="userColumns" :data="users">
              <template #operations="{ record }">
                <a-space>
                  <a-button type="text" @click="editUser(record)">编辑</a-button>
                  <a-button type="text" status="danger" @click="deleteUser(record)">删除</a-button>
                </a-space>
              </template>
            </a-table>
          </div>

          <!-- 其他管理面板 -->
          <div v-else>
            <a-result status="info" title="功能开发中">
              <template #extra>
                <a-button type="primary">返回</a-button>
              </template>
            </a-result>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconUser, IconCode, IconCalendar, IconSettings } from '@arco-design/web-vue/es/icon'

// 当前选中的菜单项
const selectedKey = ref('users')

// 用户表格列定义
const userColumns = [
  {
    title: '用户名',
    dataIndex: 'username',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
  },
  {
    title: '角色',
    dataIndex: 'role',
  },
  {
    title: '注册时间',
    dataIndex: 'registerTime',
  },
  {
    title: '操作',
    slotName: 'operations',
  },
]

// 模拟用户数据
const users = ref([
  {
    username: 'admin',
    email: 'admin@haxoj.com',
    role: '管理员',
    registerTime: '2025-04-30',
  },
  {
    username: 'user1',
    email: 'user1@example.com',
    role: '普通用户',
    registerTime: '2025-04-30',
  },
])

// 菜单点击处理
const handleMenuClick = (key) => {
  selectedKey.value = key
}

// 用户管理操作
const editUser = (user) => {
  // TODO: 实现用户编辑功能
  console.log('编辑用户:', user)
}

const deleteUser = (user) => {
  // TODO: 实现用户删除功能
  console.log('删除用户:', user)
}
</script>

<style scoped>
.admin-container {
  height: calc(100vh - 180px);
  padding: 20px;
}

.content-panel {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.arco-menu {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
