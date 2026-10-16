<!--
 * @Description: 题库列表页（所有用户可见）
 * 功能：
 *   1. 调用脱敏接口 /question/list/page/vo 分页展示题目（标题 / 标签 / 通过率 / 出题人 / 时间）
 *   2. 支持按标题搜索、分页（VO 接口限制 pageSize <= 20）
 *   3. 完整的加载状态：加载中（表格 loading）/ 加载失败（错误提示 + 重试）/ 空数据
 *   4. 短时缓存（见 utils/questionListCache）：TTL 内相同查询不重复请求；
 *      手动刷新可跳过缓存，提交代码/管理员改题后缓存会被主动作废
 *   5. 点击「做题」跳转做题页 /problems/:id
-->
<template>
  <div class="problems-container">
    <a-card :bordered="false" class="problems-card">
      <!-- ==================== 顶部搜索栏 ==================== -->
      <div class="toolbar">
        <a-space wrap>
          <a-input
            v-model="searchParams.title"
            placeholder="按题目标题搜索"
            allow-clear
            style="width: 240px"
            @press-enter="handleSearch"
          />
          <a-button type="primary" @click="handleSearch">搜索</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-space>
        <!-- 手动刷新：跳过缓存强制拉取最新数据（如刚有其他人提交、管理员改题） -->
        <a-button :loading="loading" @click="loadData(true)">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </div>

      <!-- ==================== 加载失败提示 ==================== -->
      <a-alert v-if="loadError" type="error" class="error-alert" :message="loadError" show-icon>
        <template #extra>
          <a-button type="text" size="small" @click="loadData(true)">重试</a-button>
        </template>
      </a-alert>

      <!-- ==================== 题目列表 ==================== -->
      <a-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1000 }"
        row-key="id"
        class="question-table"
      >
        <!-- 标题：可点击直接进入做题页 -->
        <template #title="{ record }">
          <a-link class="question-title" @click="goSolve(record)">{{ record.title }}</a-link>
        </template>

        <!-- 标签：VO 中 tagList 已是数组，无需再解析 JSON -->
        <template #tags="{ record }">
          <a-space wrap :size="4">
            <a-tag v-for="tag in record.tagList" :key="tag" color="arcoblue">{{ tag }}</a-tag>
            <span v-if="!record.tagList?.length" class="empty-text">-</span>
          </a-space>
        </template>

        <!-- 通过率：百分比着色 + (通过数/提交数) -->
        <template #submitInfo="{ record }">
          <span class="rate" :class="getAcceptRateClass(record.acceptedNum, record.submitNum)">
            {{ getAcceptRate(record.acceptedNum, record.submitNum) }}%
          </span>
          <span class="ratio">({{ record.acceptedNum ?? 0 }}/{{ record.submitNum ?? 0 }})</span>
        </template>

        <!-- 出题人：脱敏 VO 关联的用户信息 -->
        <template #creator="{ record }">
          {{ record.user?.userName ?? record.userId ?? '-' }}
        </template>

        <!-- 创建时间 -->
        <template #createTime="{ record }">
          {{ formatDateTime(record.createTime) }}
        </template>

        <!-- 操作 -->
        <template #operations="{ record }">
          <a-button type="primary" size="small" @click="goSolve(record)">做题</a-button>
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
          :page-size-options="[10, 20]"
          @change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconRefresh } from '@arco-design/web-vue/es/icon'
import { QuestionControllerService } from '@/api'
import type { QuestionVO } from '@/api'
import { formatDateTime, getAcceptRate, getAcceptRateClass } from '@/utils/question'
import { getQuestionListCache, setQuestionListCache } from '@/utils/questionListCache'

defineOptions({
  name: 'ProblemsPage',
})

const router = useRouter()

// ==================== 列表缓存 ====================
// 缓存实现抽在 @/utils/questionListCache（做题页提交、管理员改题后会主动作废它）
const buildCacheKey = () => `${searchParams.title}|${searchParams.current}|${searchParams.pageSize}`

// ==================== 页面状态 ====================
const loading = ref(false)
const loadError = ref('')
const dataList = ref<QuestionVO[]>([])
const total = ref(0)

// 查询参数（VO 接口 pageSize 最大为 20）
const searchParams = reactive({
  title: '',
  current: 1,
  pageSize: 10,
})

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', width: 180 },
  { title: '标题', slotName: 'title', ellipsis: true, tooltip: true },
  { title: '标签', slotName: 'tags', width: 200 },
  { title: '通过率', slotName: 'submitInfo', width: 130 },
  { title: '出题人', slotName: 'creator', width: 140 },
  { title: '创建时间', slotName: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 100, align: 'center' as const },
]

// ==================== 加载题目列表 ====================
// forceRefresh = true 时跳过缓存（用于失败重试）
const loadData = async (forceRefresh = false) => {
  const cacheKey = buildCacheKey()

  // 命中有效缓存：直接渲染，不发请求
  if (!forceRefresh) {
    const cached = getQuestionListCache<QuestionVO[]>(cacheKey)
    if (cached) {
      dataList.value = cached.data
      total.value = cached.total
      loadError.value = ''
      return
    }
  }

  loading.value = true
  loadError.value = ''
  try {
    const res = await QuestionControllerService.listQuestionVoByPageUsingPost({
      questionQueryRequest: {
        title: searchParams.title || undefined,
        current: searchParams.current,
        pageSize: searchParams.pageSize,
        sortField: 'createTime',
        sortOrder: 'descend',
      },
    })
    if (res.code === 0 && res.data) {
      const records = (res.data.records ?? []) as QuestionVO[]
      dataList.value = records
      total.value = Number(res.data.total ?? 0)
      // 写入缓存
      setQuestionListCache(cacheKey, records, total.value)
    } else {
      loadError.value = res.message || '题目列表加载失败'
    }
  } catch (error) {
    console.error('加载题目列表失败', error)
    loadError.value = '加载题目列表失败，请检查网络或后端服务'
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
  searchParams.title = ''
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

// ==================== 跳转做题页 ====================
// 雪花 ID 保持字符串直接拼进路径，避免 Number 转换导致精度丢失
const goSolve = (record: QuestionVO) => {
  router.push(`/problems/${record.id}`)
}

onMounted(() => loadData())
</script>

<style scoped>
.problems-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.problems-card {
  background-color: #fff;
  border-radius: 8px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.error-alert {
  margin-bottom: 16px;
}

.question-table {
  margin-top: 4px;
}

.question-title {
  font-size: 14px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 通过率百分比：按高低着色（与题目管理页保持一致） */
.rate {
  font-weight: 600;
  margin-right: 4px;
}

.rate-high {
  color: #00b42a;
}

.rate-mid {
  color: #ff7d00;
}

.rate-low {
  color: #f53f3f;
}

.rate-empty {
  color: #86909c;
  font-weight: 500;
}

.ratio {
  color: #86909c;
  font-size: 12px;
}

.empty-text {
  color: #c9cdd4;
}

/* 窄屏时减小容器内边距，给表格留更多空间 */
@media (max-width: 768px) {
  .problems-container {
    padding: 12px;
  }
}
</style>
