<!--
 * @Description: 题目管理页面（管理员）
 * 功能：
 *   1. 分页展示题目列表（标题 / 标签 / 判题限制 / 通过率 / 创建人 / 时间）
 *   2. 每行提供「修改」「删除」操作
 *   3. 修改：跳转到创建题目页面（/admin/questions/create?id=xxx）复用新增组件
 *   4. 删除：二次确认弹窗后调用删除接口
-->
<template>
  <div class="manage-question-container">
    <a-card :bordered="false" class="manage-card">
      <!-- ==================== 顶部操作栏 ==================== -->
      <div class="toolbar">
        <a-space>
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
        <a-button type="primary" @click="goCreateQuestion">
          <template #icon><icon-plus /></template>
          创建题目
        </a-button>
      </div>

      <!-- ==================== 题目列表 ==================== -->
      <a-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        class="question-table"
      >
        <!-- 标签：后端实体字段 tags 是 JSON 字符串，已在 loadData 中解析为 tagList -->
        <template #tags="{ record }">
          <a-space wrap :size="4">
            <a-tag v-for="tag in record.tagList" :key="tag" color="arcoblue">{{ tag }}</a-tag>
            <span v-if="!record.tagList?.length" class="empty-text">-</span>
          </a-space>
        </template>

        <!-- 判题配置：后端实体字段 judgeConfig 是 JSON 字符串，已解析为 judgeConfigObj -->
        <template #judgeConfig="{ record }">
          <a-space wrap :size="4">
            <a-tag v-if="record.judgeConfigObj?.timeLimit" color="green">
              时间 {{ record.judgeConfigObj.timeLimit }}ms
            </a-tag>
            <a-tag v-if="record.judgeConfigObj?.memoryLimit" color="orange">
              内存 {{ record.judgeConfigObj.memoryLimit }}KB
            </a-tag>
            <a-tag v-if="record.judgeConfigObj?.stackLimit" color="purple">
              栈 {{ record.judgeConfigObj.stackLimit }}KB
            </a-tag>
            <span v-if="!record.judgeConfigObj" class="empty-text">-</span>
          </a-space>
        </template>

        <!-- 通过 / 提交：通过率 + (通过数/提交数)，如 50%(5/10) -->
        <template #submitInfo="{ record }">
          <span class="rate" :class="getAcceptRateClass(record.acceptedNum, record.submitNum)">
            {{ getAcceptRate(record.acceptedNum, record.submitNum) }}%
          </span>
          <span class="ratio">({{ record.acceptedNum ?? 0 }}/{{ record.submitNum ?? 0 }})</span>
        </template>

        <!-- 创建时间：格式化为 YYYY-MM-DD HH:mm:ss -->
        <template #createTime="{ record }">
          {{ formatDateTime(record.createTime) }}
        </template>

        <!-- 创建人：原始实体只返回 userId，不再有脱敏后的用户名 -->
        <template #creator="{ record }">
          {{ record.userId ?? '-' }}
        </template>

        <!-- 操作 -->
        <template #operations="{ record }">
          <a-space>
            <a-button type="text" @click="goEditQuestion(record)">修改</a-button>
            <a-popconfirm content="确认删除这道题目？删除后不可恢复。" @ok="handleDelete(record)">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { QuestionControllerService } from '@/api'
import type { JudgeConfig, Question } from '@/api'
import { formatDateTime, getAcceptRate, getAcceptRateClass } from '@/utils/question'
import { clearQuestionListCache } from '@/utils/questionListCache'

defineOptions({
  name: 'ManageQuestion',
})

const router = useRouter()

// 表格行：在原始 Question 实体基础上，补充解析后的标签与判题配置
type QuestionRow = Question & {
  tagList: string[]
  judgeConfigObj?: JudgeConfig
}

const loading = ref(false)
const dataList = ref<QuestionRow[]>([])
const total = ref(0)

// ==================== JSON 字段解析工具 ====================
// 后端 Question 实体中 tags / judgeConfig 存的是 JSON 字符串，需前端自行解析
const parseTagList = (tags?: string): string[] => {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const parseJudgeConfig = (judgeConfig?: string): JudgeConfig | undefined => {
  if (!judgeConfig) return undefined
  try {
    return JSON.parse(judgeConfig) as JudgeConfig
  } catch {
    return undefined
  }
}

// 查询参数
const searchParams = reactive({
  title: '',
  current: 1,
  pageSize: 10,
})

// 表格列定义
const columns = [
  // 雪花 id 为 19 位字符串，列宽需足够
  { title: 'ID', dataIndex: 'id', width: 180 },
  { title: '标题', dataIndex: 'title', ellipsis: true, tooltip: true },
  { title: '标签', slotName: 'tags' },
  { title: '判题限制', slotName: 'judgeConfig', width: 240 },
  { title: '通过率', slotName: 'submitInfo', width: 130 },
  { title: '创建者', slotName: 'creator', width: 180 },
  { title: '创建时间', slotName: 'createTime', width: 180 },
  { title: '操作', slotName: 'operations', width: 160 },
]

// ==================== 加载题目列表 ====================
// 管理页为管理员专属，直接使用未脱敏的 /list/page 接口：
//   1. 一次查询拿到完整实体，无需按行补查用户信息
//   2. 不受 VO 接口 pageSize <= 20 的限制
const loadData = async () => {
  loading.value = true
  try {
    const res = await QuestionControllerService.listQuestionByPageUsingPost({
      questionQueryRequest: {
        title: searchParams.title || undefined,
        current: searchParams.current,
        pageSize: searchParams.pageSize,
        sortField: 'createTime',
        sortOrder: 'descend',
      },
    })
    if (res.code === 0 && res.data) {
      const records = (res.data.records ?? []) as Question[]
      dataList.value = records.map((item) => ({
        ...item,
        tagList: parseTagList(item.tags),
        judgeConfigObj: parseJudgeConfig(item.judgeConfig),
      }))
      total.value = res.data.total ?? 0
    } else {
      Message.error(res.message || '加载题目列表失败')
    }
  } catch (error) {
    console.error('加载题目列表失败', error)
    Message.error('加载题目列表失败，请检查网络或后端服务')
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

// ==================== 跳转 ====================
const goCreateQuestion = () => {
  router.push('/admin/questions/create')
}

// 修改：复用创建题目组件，通过 query.id 告知要编辑的题目
const goEditQuestion = (record: Question) => {
  router.push({ path: '/admin/questions/create', query: { id: record.id } })
}

// ==================== 删除 ====================
const handleDelete = async (record: Question) => {
  try {
    const res = await QuestionControllerService.deleteQuestionUsingPost({
      deleteRequest: { id: record.id },
    })
    if (res.code === 0) {
      Message.success('删除成功')
      // 题目被删除，同步作废公开题库列表的缓存
      clearQuestionListCache()
      loadData()
    } else {
      Message.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除题目失败', error)
    Message.error('删除失败，请检查网络或后端服务')
  }
}

onMounted(loadData)
</script>

<style scoped>
.manage-question-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.manage-card {
  background-color: #fff;
  border-radius: 8px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-table {
  margin-top: 4px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 通过率百分比：按高低着色 */
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

/* 括号里的 通过数/提交数 */
.ratio {
  color: #86909c;
  font-size: 12px;
}

.empty-text {
  color: #c9cdd4;
}
</style>
