<!--
 * @Description: 用户中心（/user/center，需登录）
 * 数据来源：
 *   1. 用户信息：GET /user/get/login（LoginUserVO）
 *   2. 最近提交：POST /question_submit/my/list/page（取最近 5 条）
 * 说明：登录态失效由 plugins/axios.ts 统一处理（40100 → 清状态 + 跳登录），
 *       本页只负责展示，不重复做跳转逻辑。
-->
<template>
  <div class="user-container">
    <!-- ==================== 用户信息 ==================== -->
    <a-card class="user-card" :loading="userLoading">
      <template #title>
        <div class="card-title"><icon-user /> 用户信息</div>
      </template>
      <div class="profile">
        <a-avatar :size="64" :image-url="user?.userAvatar || undefined">
          {{ (user?.userName || '?').slice(0, 1).toUpperCase() }}
        </a-avatar>
        <div class="profile-main">
          <div class="profile-name">{{ user?.userName || '未命名用户' }}</div>
          <div class="profile-sub">{{ user?.userProfile || '这个人很懒，还没有写简介' }}</div>
        </div>
        <a-tag :color="isAdmin ? 'arcoblue' : 'gray'">{{ roleText }}</a-tag>
      </div>
      <a-descriptions class="profile-detail" :data="userInfoItems" layout="inline-vertical" />
    </a-card>

    <!-- ==================== 最近提交 ==================== -->
    <a-card class="submission-card">
      <template #title>
        <div class="card-title">
          <icon-code /> 最近提交
          <a-button type="text" size="small" class="more-btn" @click="goAllSubmissions">
            查看全部
          </a-button>
        </div>
      </template>

      <a-alert v-if="submissionError" type="error" :message="submissionError" show-icon>
        <template #extra>
          <a-button type="text" size="small" @click="loadSubmissions">重试</a-button>
        </template>
      </a-alert>

      <a-table
        v-else
        :columns="columns"
        :data="submissions"
        :loading="submissionLoading"
        :pagination="false"
        row-key="id"
        row-class="clickable-row"
        @row-click="handleRowClick"
      >
        <template #question="{ record }">
          <a-link v-if="record.questionVO?.id" @click.stop="goProblem(record)">
            {{ record.questionVO.title }}
          </a-link>
          <span v-else class="empty-text">题目 #{{ record.questionId }}</span>
        </template>
        <template #status="{ record }">
          <a-tag :color="getSubmissionStatusColor(record.status)">
            {{ getSubmissionStatusText(record) }}
          </a-tag>
        </template>
        <template #language="{ record }">{{ formatLanguageLabel(record.language) }}</template>
        <template #createTime="{ record }">{{ formatDateTime(record.createTime) }}</template>
        <template #empty>
          <a-empty description="还没有提交记录">
            <a-button type="primary" size="small" @click="router.push('/problems')">去题库</a-button>
          </a-empty>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconCode, IconUser } from '@arco-design/web-vue/es/icon'
import { QuestionSubmitControllerService, UserControllerService } from '@/api'
import type { LoginUserVO, QuestionSubmitVO } from '@/api'
import { formatDateTime } from '@/utils/question'
import {
  formatLanguageLabel,
  getSubmissionStatusColor,
  getSubmissionStatusText,
} from '@/utils/submission'

defineOptions({
  name: 'UserCenterPage',
})

const router = useRouter()

// ==================== 用户信息 ====================
const userLoading = ref(false)
const user = ref<LoginUserVO | null>(null)

// 角色文案：后端 userRole 只有 user / admin 两种实际取值（ban 由后端拦截，不在前端展示层处理）
const roleText = computed(() => (user.value?.userRole === 'admin' ? '管理员' : '普通用户'))
const isAdmin = computed(() => user.value?.userRole === 'admin')

const userInfoItems = computed(() => [
  { label: '昵称', value: user.value?.userName || '-' },
  { label: '角色', value: roleText.value },
  { label: '注册时间', value: formatDateTime(user.value?.createTime) },
  { label: '简介', value: user.value?.userProfile || '-' },
])

const loadUser = async () => {
  userLoading.value = true
  try {
    const res = await UserControllerService.getLoginUserUsingGet()
    if (res.code === 0 && res.data) {
      user.value = res.data
    }
  } catch (error) {
    console.error('加载当前用户信息失败', error)
  } finally {
    userLoading.value = false
  }
}

// ==================== 最近提交 ====================
const submissionLoading = ref(false)
const submissionError = ref('')
const submissions = ref<QuestionSubmitVO[]>([])

const columns = [
  { title: '题目', slotName: 'question', ellipsis: true },
  { title: '状态', slotName: 'status', width: 140 },
  { title: '语言', slotName: 'language', width: 90 },
  { title: '提交时间', slotName: 'createTime', width: 170 },
]

const loadSubmissions = async () => {
  submissionLoading.value = true
  submissionError.value = ''
  try {
    const res = await QuestionSubmitControllerService.listMyQuestionSubmitVoByPageUsingPost({
      questionSubmitQueryRequest: {
        current: 1,
        pageSize: 5,
        sortField: 'createTime',
        sortOrder: 'descend',
      },
    })
    if (res.code === 0 && res.data) {
      submissions.value = (res.data.records ?? []) as QuestionSubmitVO[]
    } else {
      submissionError.value = res.message || '提交记录加载失败'
    }
  } catch (error) {
    console.error('加载最近提交失败', error)
    submissionError.value = '提交记录加载失败，请检查网络或后端服务'
  } finally {
    submissionLoading.value = false
  }
}

// ==================== 跳转 ====================
const goAllSubmissions = () => {
  router.push('/submissions')
}

const goProblem = (record: QuestionSubmitVO) => {
  const questionId = record.questionVO?.id ?? record.questionId
  if (questionId) {
    router.push(`/problems/${questionId}`)
  }
}

const handleRowClick = (record: QuestionSubmitVO) => {
  goProblem(record)
}

onMounted(() => {
  loadUser()
  loadSubmissions()
})
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

.more-btn {
  margin-left: auto;
  font-weight: 400;
}

.profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 18px;
  font-weight: 500;
  color: #1d2129;
}

.profile-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #86909c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-detail {
  margin-top: 16px;
}

.submission-card :deep(.clickable-row) {
  cursor: pointer;
}

.empty-text {
  color: #86909c;
}
</style>
