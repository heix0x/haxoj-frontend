<!--
 * @Description: 用户管理页面（管理员，/admin/users）
 * 功能：
 *   1. 分页展示用户列表（头像 / 账号 / 昵称 / 角色 / 简介 / 注册时间）
 *   2. 支持按昵称模糊搜索、按角色筛选
 *   3. 新增用户（初始密码由后端固定为 12345678）
 *   4. 编辑用户（昵称 / 头像 / 角色 / 简介）
 *   5. 删除用户（二次确认）
 * 说明：管理页使用未脱敏的 /list/page 接口（管理员专属、无 pageSize <= 20 的限制）
-->
<template>
  <div class="admin-users">
    <a-card :bordered="false" class="users-card">
      <!-- ==================== 顶部操作栏 ==================== -->
      <div class="toolbar">
        <a-space>
          <a-input
            v-model="searchParams.userName"
            placeholder="按昵称搜索"
            allow-clear
            style="width: 200px"
            @press-enter="handleSearch"
          />
          <a-select
            v-model="searchParams.userRole"
            placeholder="全部角色"
            allow-clear
            style="width: 140px"
          >
            <a-option value="user">普通用户</a-option>
            <a-option value="admin">管理员</a-option>
          </a-select>
          <a-button type="primary" @click="handleSearch">搜索</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-space>
        <a-button type="primary" @click="openAddModal">
          <template #icon><icon-plus /></template>
          新增用户
        </a-button>
      </div>

      <!-- ==================== 用户列表 ==================== -->
      <a-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #userAvatar="{ record }">
          <a-avatar :size="32" style="background-color: #3c7eff">
            <img v-if="record.userAvatar" :src="record.userAvatar" alt="avatar" />
            <span v-else>{{ record.userName?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </a-avatar>
        </template>

        <template #userRole="{ record }">
          <a-tag :color="record.userRole === 'admin' ? 'red' : 'arcoblue'">
            {{ record.userRole === 'admin' ? '管理员' : '普通用户' }}
          </a-tag>
        </template>

        <template #operations="{ record }">
          <a-space>
            <a-button type="text" @click="openEditModal(record)">编辑</a-button>
            <a-popconfirm content="确认删除该用户？删除后不可恢复。" @ok="handleDelete(record)">
              <a-button type="text" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>

      <!-- ==================== 分页 ==================== -->
      <div class="pagination-wrap">
        <a-pagination
          :total="total"
          :current="searchParams.current"
          :page-size="searchParams.pageSize"
          show-total
          show-page-size
          :page-size-options="[10, 20, 50]"
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </a-card>

    <!-- ==================== 新增 / 编辑弹窗 ==================== -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :ok-loading="submitting"
      @before-ok="handleBeforeOk"
      @cancel="handleCancel"
    >
      <a-form ref="formRef" :model="form" :rules="formRules" layout="vertical">
        <a-form-item v-if="!isEdit" field="userAccount" label="账号">
          <a-input v-model="form.userAccount" placeholder="登录账号" />
        </a-form-item>
        <a-form-item field="userName" label="昵称">
          <a-input v-model="form.userName" placeholder="用户昵称" />
        </a-form-item>
        <a-form-item field="userAvatar" label="头像地址">
          <a-input v-model="form.userAvatar" placeholder="头像图片 URL（可选）" />
        </a-form-item>
        <a-form-item field="userRole" label="角色">
          <a-radio-group v-model="form.userRole">
            <a-radio value="user">普通用户</a-radio>
            <a-radio value="admin">管理员</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="userProfile" label="简介">
          <a-textarea
            v-model="form.userProfile"
            placeholder="用户简介（可选）"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>
      </a-form>
      <a-alert v-if="!isEdit" type="normal">
        新增用户的初始密码为 12345678，请提醒用户及时修改。
      </a-alert>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { FormInstance } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { UserControllerService } from '@/api'
import type { User } from '@/api'

defineOptions({
  name: 'AdminUsers',
})

const loading = ref(false)
const dataList = ref<User[]>([])
const total = ref(0)

// 查询参数
const searchParams = reactive({
  userName: '',
  userRole: '',
  current: 1,
  pageSize: 10,
})

// 表格列定义
const columns = [
  // 雪花 id 为 19 位字符串，列宽需足够
  { title: 'ID', dataIndex: 'id', width: 180 },
  { title: '头像', slotName: 'userAvatar', width: 80 },
  { title: '账号', dataIndex: 'userAccount', width: 160 },
  { title: '昵称', dataIndex: 'userName', ellipsis: true, tooltip: true },
  { title: '角色', slotName: 'userRole', width: 120 },
  { title: '简介', dataIndex: 'userProfile', ellipsis: true, tooltip: true },
  { title: '注册时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 150 },
]

// ==================== 加载用户列表 ====================
const loadData = async () => {
  loading.value = true
  try {
    const res = await UserControllerService.listUserByPageUsingPost({
      userQueryRequest: {
        userName: searchParams.userName || undefined,
        userRole: searchParams.userRole || undefined,
        current: searchParams.current,
        pageSize: searchParams.pageSize,
        sortField: 'createTime',
        sortOrder: 'descend',
      },
    })
    if (res.code === 0 && res.data) {
      dataList.value = (res.data.records ?? []) as User[]
      total.value = Number(res.data.total ?? 0)
    } else {
      Message.error(res.message || '加载用户列表失败')
    }
  } catch (error) {
    console.error('加载用户列表失败', error)
    Message.error('加载用户列表失败，请检查网络或后端服务')
  } finally {
    loading.value = false
  }
}

// ==================== 搜索 / 重置 ====================
const handleSearch = () => {
  searchParams.current = 1
  loadData()
}

const handleReset = () => {
  searchParams.userName = ''
  searchParams.userRole = ''
  searchParams.current = 1
  loadData()
}

// ==================== 分页 ====================
const handlePageChange = (current: number) => {
  searchParams.current = current
  loadData()
}

const handlePageSizeChange = (pageSize: number) => {
  searchParams.pageSize = pageSize
  searchParams.current = 1
  loadData()
}

// ==================== 新增 / 编辑 ====================
const modalVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const createDefaultForm = () => ({
  id: '' as string | undefined,
  userAccount: '',
  userName: '',
  userAvatar: '',
  userRole: 'user',
  userProfile: '',
})

const form = reactive(createDefaultForm())

// 账号仅新增时必填（编辑不允许改账号）
const formRules = {
  userAccount: [{ required: true, message: '请输入账号' }],
  userName: [{ required: true, message: '请输入昵称' }],
}

const openAddModal = () => {
  isEdit.value = false
  Object.assign(form, createDefaultForm())
  formRef.value?.clearValidate()
  modalVisible.value = true
}

const openEditModal = (record: User) => {
  isEdit.value = true
  Object.assign(form, createDefaultForm(), {
    id: record.id,
    userName: record.userName ?? '',
    userAvatar: record.userAvatar ?? '',
    userRole: record.userRole ?? 'user',
    userProfile: record.userProfile ?? '',
  })
  formRef.value?.clearValidate()
  modalVisible.value = true
}

const handleCancel = () => {
  formRef.value?.clearValidate()
}

// 提交前先做表单校验，校验不通过则不关闭弹窗
const handleBeforeOk = async () => {
  const errors = await formRef.value?.validate()
  if (errors) {
    return false
  }

  submitting.value = true
  try {
    const res = isEdit.value
      ? await UserControllerService.updateUserUsingPost({
          userUpdateRequest: {
            id: form.id as any,
            userName: form.userName,
            userAvatar: form.userAvatar || undefined,
            userRole: form.userRole,
            userProfile: form.userProfile || undefined,
          },
        })
      : await UserControllerService.addUserUsingPost({
          userAddRequest: {
            userAccount: form.userAccount,
            userName: form.userName,
            userAvatar: form.userAvatar || undefined,
            userRole: form.userRole,
          },
        })

    if (res.code === 0) {
      Message.success(isEdit.value ? '修改成功' : '新增成功')
      // 新增后回到第一页，方便看到新数据
      if (!isEdit.value) {
        searchParams.current = 1
      }
      loadData()
      return true
    }

    Message.error(res.message || (isEdit.value ? '修改失败' : '新增失败'))
    return false
  } catch (error) {
    console.error('保存用户失败', error)
    Message.error('保存失败，请检查网络或后端服务')
    return false
  } finally {
    submitting.value = false
  }
}

// ==================== 删除 ====================
const handleDelete = async (record: User) => {
  try {
    const res = await UserControllerService.deleteUserUsingPost({
      deleteRequest: { id: record.id as any },
    })
    if (res.code === 0) {
      Message.success('删除成功')
      // 删掉当前页最后一条时回退一页
      if (dataList.value.length === 1 && searchParams.current > 1) {
        searchParams.current -= 1
      }
      loadData()
    } else {
      Message.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除用户失败', error)
    Message.error('删除失败，请检查网络或后端服务')
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-users {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.users-card {
  background-color: #fff;
  border-radius: 8px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
