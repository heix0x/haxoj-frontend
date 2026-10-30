<!--
 * @Description: 提交记录页（/submissions，需登录）
 * 功能：
 *   1. 调用 /question_submit/my/list/page 展示当前用户的提交历史
 *      （题目 / 状态 / 语言 / 耗时 / 内存 / 提交时间），服务端分页
 *   2. 按状态筛选；存在「待判题 / 判题中」记录时每 3 秒自动刷新（最多 60 秒）
 *   3. 点击行打开详情抽屉：只读回看当次提交的源码与判题信息
 * 数据口径：状态与格式化统一来自 @/utils/submission，不要在本页另写一套
-->
<template>
  <div class="submissions-container">
    <a-card :bordered="false" class="submissions-card">
      <!-- ==================== 顶部工具栏 ==================== -->
      <div class="toolbar">
        <a-space wrap>
          <a-select
            v-model="searchParams.status"
            :options="statusOptions"
            placeholder="全部状态"
            allow-clear
            style="width: 140px"
            @change="handleFilterChange"
          />
          <a-button :loading="loading" @click="handleRefresh">
            <template #icon><icon-refresh /></template>
            刷新
          </a-button>
        </a-space>
        <!-- 判题是异步的：列表里还有中间态记录时自动轮询，直到全部出结果 -->
        <span v-if="pendingCount > 0 && !loadError" class="poll-hint">
          <a-spin :size="14" />
          有 {{ pendingCount }} 条判题中，每 {{ POLL_INTERVAL / 1000 }} 秒自动刷新
        </span>
      </div>

      <!-- ==================== 加载失败提示 ==================== -->
      <a-alert v-if="loadError" type="error" class="error-alert" :message="loadError" show-icon>
        <template #extra>
          <a-button type="text" size="small" @click="handleRefresh">重试</a-button>
        </template>
      </a-alert>

      <!-- ==================== 提交列表 ==================== -->
      <a-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 860 }"
        row-key="id"
        row-class="clickable-row"
        class="submission-table"
        @row-click="openDetail"
      >
        <!-- 题目：可点击回做题页；题目被删时只显示编号 -->
        <template #question="{ record }">
          <a-link v-if="record.questionVO?.id" class="question-link" @click.stop="goProblem(record)">
            {{ record.questionVO.title }}
          </a-link>
          <span v-else class="empty-text">题目 #{{ record.questionId }}</span>
        </template>

        <!-- 状态：失败时展示具体结论（答案错误/编译错误/超时…） -->
        <template #status="{ record }">
          <a-tag :color="getSubmissionStatusColor(record.status)">
            {{ getSubmissionStatusText(record) }}
          </a-tag>
        </template>

        <template #language="{ record }">
          {{ formatLanguageLabel(record.language) }}
        </template>

        <template #time="{ record }">
          {{ formatDurationMs(record.judgeInfo?.time) }}
        </template>

        <template #memory="{ record }">
          {{ formatMemoryKb(record.judgeInfo?.memory) }}
        </template>

        <template #createTime="{ record }">
          {{ formatDateTime(record.createTime) }}
        </template>

        <!-- 操作：给"点行看详情"一个显式入口，避免可点击性靠猜 -->
        <template #operations="{ record }">
          <a-button type="text" size="small" @click.stop="openDetail(record)">详情</a-button>
        </template>
      </a-table>

      <!-- ==================== 分页（后端限制 pageSize <= 20） ==================== -->
      <div class="pagination-wrap">
        <a-pagination
          :total="total"
          :current="searchParams.current"
          :page-size="searchParams.pageSize"
          show-total
          show-page-size
          :page-size-options="[10, 20]"
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </a-card>

    <!-- ==================== 提交详情抽屉 ==================== -->
    <a-drawer v-model:visible="detailVisible" :width="720" :footer="false" unmount-on-close>
      <template #title>提交详情</template>
      <div v-if="detailRecord">
        <a-descriptions :column="2" size="medium" bordered>
          <a-descriptions-item label="状态">
            <a-tag :color="getSubmissionStatusColor(detailRecord.status)">
              {{ getSubmissionStatusText(detailRecord) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="判题结论">
            {{ translateJudgeMessage(detailRecord.judgeInfo?.message) }}
          </a-descriptions-item>
          <a-descriptions-item label="语言">
            {{ formatLanguageLabel(detailRecord.language) }}
          </a-descriptions-item>
          <a-descriptions-item label="提交时间">
            {{ formatDateTime(detailRecord.createTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="耗时">
            {{ formatDurationMs(detailRecord.judgeInfo?.time) }}
          </a-descriptions-item>
          <a-descriptions-item label="内存">
            {{ formatMemoryKb(detailRecord.judgeInfo?.memory) }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="code-label">提交代码</div>
        <!-- unmount-on-close 让抽屉关闭时销毁编辑器，Monaco 组件内部会 dispose 释放内存 -->
        <MonacoEditor v-model="detailCode" :language="detailMonacoLanguage" height="420px" readonly />
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import { QuestionSubmitControllerService } from '@/api'
import type { QuestionSubmitVO } from '@/api'
import { formatDateTime } from '@/utils/question'
import {
  formatDurationMs,
  formatLanguageLabel,
  formatMemoryKb,
  getMonacoLanguage,
  getSubmissionStatusColor,
  getSubmissionStatusText,
  isPendingStatus,
  SUBMISSION_STATUS,
  translateJudgeMessage,
} from '@/utils/submission'
import MonacoEditor from '@/components/MonacoEditor.vue'

defineOptions({
  name: 'SubmissionsPage',
})

const router = useRouter()

// ==================== 轮询参数 ====================
// 判题走 MQ 异步，通常几秒内出结果；60 秒还不出就该去看后端了，不能无限打接口
const POLL_INTERVAL = 3000
const POLL_MAX_ROUNDS = 20

// ==================== 页面状态 ====================
const loading = ref(false)
const loadError = ref('')
const dataList = ref<QuestionSubmitVO[]>([])
const total = ref(0)

// 查询参数（my/list/page 接口 pageSize 最大 20，超过直接 40000）
const searchParams = reactive({
  current: 1,
  pageSize: 10,
  status: undefined as number | undefined,
})

const statusOptions = [
  { label: '待判题', value: SUBMISSION_STATUS.WAITING },
  { label: '判题中', value: SUBMISSION_STATUS.RUNNING },
  { label: '成功', value: SUBMISSION_STATUS.SUCCEED },
  { label: '失败', value: SUBMISSION_STATUS.FAILED },
]

const columns = [
  { title: '题目', slotName: 'question', ellipsis: true },
  { title: '状态', slotName: 'status', width: 140 },
  { title: '语言', slotName: 'language', width: 90 },
  { title: '耗时', slotName: 'time', width: 90 },
  { title: '内存', slotName: 'memory', width: 100 },
  { title: '提交时间', slotName: 'createTime', width: 170 },
  { title: '操作', slotName: 'operations', width: 80, align: 'center' as const },
]

// ==================== 列表加载 ====================
// silent = true 时不显示表格 loading（轮询用，避免每 3 秒闪一次加载态）
const loadData = async (silent = false) => {
  if (loading.value) return
  loading.value = !silent
  loadError.value = ''
  try {
    const res = await QuestionSubmitControllerService.listMyQuestionSubmitVoByPageUsingPost({
      questionSubmitQueryRequest: {
        current: searchParams.current,
        pageSize: searchParams.pageSize,
        // a-select 清空时可能给 '' / null，后端要的是 Integer，这里统一收敛成 undefined
        // （undefined 字段会被 JSON 序列化丢弃，后端就不会拼进查询条件）
        status: typeof searchParams.status === 'number' ? searchParams.status : undefined,
        sortField: 'createTime',
        sortOrder: 'descend',
      },
    })
    if (res.code === 0 && res.data) {
      dataList.value = (res.data.records ?? []) as QuestionSubmitVO[]
      total.value = Number(res.data.total ?? 0)
      // 当前页没有数据但不是第一页：说明数据被删过，回退一页而不是给用户看空页
      if (dataList.value.length === 0 && searchParams.current > 1) {
        searchParams.current -= 1
        await loadData(silent)
        return
      }
      scheduleNextPoll()
    } else {
      loadError.value = res.message || '提交记录加载失败'
      stopPolling()
    }
  } catch (error) {
    console.error('加载提交记录失败', error)
    loadError.value = '加载提交记录失败，请检查网络或后端服务'
    // 后端不可用时不轮询，避免每 3 秒打一次注定失败的请求
    stopPolling()
  } finally {
    loading.value = false
  }
}

// ==================== 轮询 ====================
let pollTimer: number | null = null
let pollRounds = 0

const pendingCount = computed(() => dataList.value.filter((item) => isPendingStatus(item.status)).length)

const stopPolling = () => {
  if (pollTimer !== null) {
    window.clearTimeout(pollTimer)
    pollTimer = null
  }
}

const scheduleNextPoll = () => {
  stopPolling()
  if (pendingCount.value === 0 || pollRounds >= POLL_MAX_ROUNDS) return
  pollTimer = window.setTimeout(() => {
    pollRounds += 1
    loadData(true)
  }, POLL_INTERVAL)
}

const resetPolling = () => {
  pollRounds = 0
}

onBeforeUnmount(stopPolling)

// ==================== 筛选 / 分页 / 刷新 ====================
const handleFilterChange = () => {
  searchParams.current = 1
  resetPolling()
  loadData()
}

const handleRefresh = () => {
  resetPolling()
  loadData()
}

const handlePageChange = (current: number) => {
  searchParams.current = current
  resetPolling()
  loadData()
}

const handlePageSizeChange = (pageSize: number) => {
  searchParams.pageSize = pageSize
  searchParams.current = 1
  resetPolling()
  loadData()
}

// ==================== 跳转做题页 ====================
// 雪花 ID 保持字符串直接拼路径，避免 Number 转换精度丢失（与题库页一致）
const goProblem = (record: QuestionSubmitVO) => {
  const questionId = record.questionVO?.id ?? record.questionId
  if (questionId) {
    router.push(`/problems/${questionId}`)
  }
}

// ==================== 详情抽屉 ====================
const detailVisible = ref(false)
const detailRecord = ref<QuestionSubmitVO | null>(null)
const detailCode = ref('')

const detailMonacoLanguage = computed(() => getMonacoLanguage(detailRecord.value?.language))

const openDetail = (record: QuestionSubmitVO) => {
  detailRecord.value = record
  detailCode.value = record.code ?? ''
  detailVisible.value = true
}

onMounted(() => loadData())
</script>

<style scoped>
.submissions-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.submissions-card {
  background-color: #fff;
  border-radius: 8px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.poll-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4e5969;
}

.error-alert {
  margin-bottom: 16px;
}

.submission-table :deep(.clickable-row) {
  cursor: pointer;
}

.question-link {
  font-weight: 500;
}

.empty-text {
  color: #86909c;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.code-label {
  margin: 16px 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}
</style>
