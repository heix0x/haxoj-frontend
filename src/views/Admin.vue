<!--
 * @Description: 管理员中心 - 概览页（/admin/overview）
 * 各管理功能的入口聚合 + 基础统计，具体的增删改查在各子页面里完成：
 *   /admin/users、/admin/questions、/admin/contests、/admin/settings
-->
<template>
  <div class="admin-overview">
    <!-- ==================== 统计概览 ==================== -->
    <a-card :bordered="false" class="overview-card">
      <template #title>
        <span class="card-title">管理概览</span>
      </template>
      <a-row :gutter="16">
        <a-col :span="12">
          <a-statistic
            title="题目总数"
            :value="questionTotal ?? 0"
            :loading="statsLoading"
            show-group-separator
          />
        </a-col>
        <a-col :span="12">
          <a-statistic
            title="用户总数"
            :value="userTotal ?? 0"
            :loading="statsLoading"
            show-group-separator
          />
        </a-col>
      </a-row>
    </a-card>

    <!-- ==================== 快捷入口 ==================== -->
    <a-card :bordered="false" class="overview-card">
      <template #title>
        <span class="card-title">快捷入口</span>
      </template>
      <a-row :gutter="16">
        <a-col v-for="entry in entries" :key="entry.path" :span="6">
          <a-card class="entry-card" hoverable @click="router.push(entry.path)">
            <div class="entry-icon">
              <component :is="entry.icon" />
            </div>
            <div class="entry-title">{{ entry.title }}</div>
            <div class="entry-desc">{{ entry.desc }}</div>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconCalendar, IconCode, IconSettings, IconUser } from '@arco-design/web-vue/es/icon'
import { QuestionControllerService, UserControllerService } from '@/api'

defineOptions({
  name: 'AdminOverview',
})

const router = useRouter()

// ==================== 统计 ====================
const questionTotal = ref<number | null>(null)
const userTotal = ref<number | null>(null)
const statsLoading = ref(false)

// 用分页接口的 total 拿总数：pageSize 传 1，最少数据量
const loadStats = async () => {
  statsLoading.value = true
  try {
    const [questionRes, userRes] = await Promise.all([
      QuestionControllerService.listQuestionByPageUsingPost({
        questionQueryRequest: { current: 1, pageSize: 1 },
      }),
      UserControllerService.listUserByPageUsingPost({
        userQueryRequest: { current: 1, pageSize: 1 },
      }),
    ])
    if (questionRes.code === 0) {
      questionTotal.value = Number(questionRes.data?.total ?? 0)
    }
    if (userRes.code === 0) {
      userTotal.value = Number(userRes.data?.total ?? 0)
    }
  } catch (error) {
    // 统计失败不阻塞页面，卡片显示 0 即可
    console.error('加载统计数据失败', error)
  } finally {
    statsLoading.value = false
  }
}

// ==================== 快捷入口 ====================
const entries = [
  { title: '用户管理', desc: '查看、新增、修改、删除用户', path: '/admin/users', icon: IconUser },
  {
    title: '题目管理',
    desc: '维护题库中的编程题目',
    path: '/admin/questions',
    icon: IconCode,
  },
  { title: '比赛管理', desc: '管理比赛信息', path: '/admin/contests', icon: IconCalendar },
  { title: '系统设置', desc: '系统相关配置', path: '/admin/settings', icon: IconSettings },
]

onMounted(loadStats)
</script>

<style scoped>
.admin-overview {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.overview-card {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
}

.entry-card {
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
}

.entry-icon {
  font-size: 28px;
  color: #3c7eff;
  margin-bottom: 8px;
}

.entry-title {
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 4px;
}

.entry-desc {
  font-size: 12px;
  color: #86909c;
}
</style>
