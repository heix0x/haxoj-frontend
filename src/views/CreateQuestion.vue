<!--
 * @Description: 创建题目页面（管理员）
 * 字段对应后端 QuestionAddRequest：
 *   title         标题
 *   tags          标签（动态添加/删除）
 *   content       题面描述（Markdown）
 *   answer        标准答案（Markdown）
 *   judgeConfig   判题配置（JSON 对象，拆成结构化数字输入）
 *   judgeCase     判题用例（JSON 数组，可增删行，每行 input/output）
-->
<template>
  <div class="create-question-container">
    <a-card :title="isEdit ? '编辑题目' : '创建题目'" :bordered="false" class="form-card">
      <a-form :model="form" layout="vertical">
        <!-- ==================== 基本信息 ==================== -->
        <a-form-item field="title" label="题目标题" required>
          <a-input
            v-model="form.title"
            placeholder="请输入题目名称，如：两数之和"
            allow-clear
            :max-length="80"
            show-word-limit
          />
        </a-form-item>

        <a-form-item field="tags" label="题目标签">
          <template #extra>输入后回车或点击添加按钮生成标签</template>
          <div class="tags-editor">
            <a-space>
              <a-input
                v-model="tagInput"
                placeholder="如：数组 / 双指针 / 动态规划"
                style="width: 260px"
                @press-enter="addTag"
              />
              <a-button type="primary" size="medium" @click="addTag">添加</a-button>
            </a-space>
            <a-space wrap class="tag-list" v-if="form.tags.length">
              <a-tag
                v-for="(tag, index) in form.tags"
                :key="tag"
                closable
                @close="removeTag(index)"
              >
                {{ tag }}
              </a-tag>
            </a-space>
          </div>
        </a-form-item>

        <!-- ==================== 题面描述 ==================== -->
        <a-form-item field="content" label="题目描述（支持 Markdown）" required>
          <MdEditor
            v-model="form.content"
            placeholder="请用 Markdown 描述题目要求、输入输出说明、示例等"
          />
        </a-form-item>

        <!-- ==================== 标准答案 ==================== -->
        <a-form-item field="answer" label="标准答案（支持 Markdown）">
          <MdEditor v-model="form.answer" placeholder="请填写题目的参考解法与思路" />
        </a-form-item>

        <!-- ==================== 判题配置（JSON 对象 -> 结构化表单） ==================== -->
        <a-divider orientation="left">判题配置</a-divider>
        <a-form-item
          field="judgeConfig"
          label="运行限制"
          extra="时间单位为毫秒(ms)，内存与栈单位为 KB（1MB = 1024KB）"
        >
          <a-row :gutter="16" class="config-row">
            <a-col :span="8">
              <div class="config-item">
                <div class="config-label">时间限制（ms）</div>
                <a-input-number
                  v-model="form.judgeConfig.timeLimit"
                  :min="1"
                  :max="30000"
                  mode="button"
                  class="config-input"
                  placeholder="如 1000"
                />
              </div>
            </a-col>
            <a-col :span="8">
              <div class="config-item">
                <div class="config-label">内存限制（KB）</div>
                <a-input-number
                  v-model="form.judgeConfig.memoryLimit"
                  :min="1"
                  mode="button"
                  class="config-input"
                  placeholder="如 262144（即 256MB）"
                />
              </div>
            </a-col>
            <a-col :span="8">
              <div class="config-item">
                <div class="config-label">栈限制（KB）</div>
                <a-input-number
                  v-model="form.judgeConfig.stackLimit"
                  :min="1"
                  mode="button"
                  class="config-input"
                  placeholder="如 131072（即 128MB）"
                />
              </div>
            </a-col>
          </a-row>
        </a-form-item>

        <!-- ==================== 判题用例（JSON 数组 -> 可增删表单） ==================== -->
        <a-divider orientation="left">判题用例</a-divider>
        <a-form-item field="judgeCase" label="测试用例（可增删）">
          <template #extra
            >每条用例包含输入(input)与期望输出(output)，可多行；提交时自动跳过空用例</template
          >
          <div class="case-list">
            <div v-for="(item, index) in form.judgeCase" :key="index" class="case-item">
              <div class="case-header">
                <span class="case-title">用例 #{{ index + 1 }}</span>
                <a-button
                  type="text"
                  status="danger"
                  size="mini"
                  :disabled="form.judgeCase.length <= 1"
                  @click="removeCase(index)"
                >
                  删除
                </a-button>
              </div>
              <a-row :gutter="12">
                <a-col :span="12">
                  <a-textarea
                    v-model="item.input"
                    placeholder="输入（input）"
                    :auto-size="{ minRows: 2, maxRows: 8 }"
                  />
                </a-col>
                <a-col :span="12">
                  <a-textarea
                    v-model="item.output"
                    placeholder="期望输出（output）"
                    :auto-size="{ minRows: 2, maxRows: 8 }"
                  />
                </a-col>
              </a-row>
            </div>
            <a-button type="outline" long @click="addCase">
              <template #icon><icon-plus /></template>
              添加测试用例
            </a-button>
          </div>
        </a-form-item>

        <!-- ==================== 提交 ==================== -->
        <a-form-item>
          <a-space>
            <a-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '提交题目' }}
            </a-button>
            <a-button size="large" @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import { QuestionControllerService } from '@/api'
import type { JudgeCase, JudgeConfig, QuestionAddRequest, QuestionUpdateRequest } from '@/api'
import MdEditor from '@/components/MdEditor.vue'
import { clearQuestionListCache } from '@/utils/questionListCache'

defineOptions({
  name: 'CreateQuestion',
})

const route = useRoute()

// ==================== 编辑模式 ====================
// 通过路由参数 /admin/questions/create?id=123 区分「新增」与「编辑」
const questionId = (route.query.id as string) || undefined
const isEdit = !!questionId

// ==================== 表单默认值 ====================
const createDefaultJudgeConfig = (): JudgeConfig => ({
  timeLimit: 1000, // 1000ms
  memoryLimit: 262144, // 256MB
  stackLimit: 131072, // 128MB
})

interface JudgeCaseFormItem extends JudgeCase {}

const createDefaultForm = () => ({
  title: '',
  tags: [] as string[],
  content: '',
  answer: '',
  judgeConfig: createDefaultJudgeConfig(),
  judgeCase: [{ input: '', output: '' }] as JudgeCaseFormItem[],
})

const form = reactive(createDefaultForm())

// 标签输入框内容
const tagInput = ref('')
// 提交 loading
const submitting = ref(false)

// ==================== 编辑模式：回填数据 ====================
// 安全解析 JSON 字符串，失败时回退到 fallback
const safeParseJson = <T,>(json: string | undefined, fallback: T): T => {
  if (!json) {
    return fallback
  }
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

const loadQuestion = async () => {
  if (!isEdit) {
    return
  }
  try {
    // 通过分页接口用 id 精确查询，拿到完整的 Question 实体（含 answer / judgeCase 等 VO 未暴露的字段）
    const res = await QuestionControllerService.listQuestionByPageUsingPost({
      questionQueryRequest: { id: questionId as any, current: 1, pageSize: 1 },
    })
    const record = res.data?.records?.[0]
    if (res.code !== 0 || !record) {
      Message.error('加载题目信息失败')
      return
    }

    form.title = record.title ?? ''
    form.content = record.content ?? ''
    form.answer = record.answer ?? ''

    // 数据库中的 JSON 字符串字段，需解析回结构化数据
    form.tags = safeParseJson<string[]>(record.tags, [])
    form.judgeCase = safeParseJson<JudgeCaseFormItem[]>(record.judgeCase, [
      { input: '', output: '' },
    ])
    if (form.judgeCase.length === 0) {
      form.judgeCase.push({ input: '', output: '' })
    }
    if (record.judgeConfig) {
      form.judgeConfig = {
        ...createDefaultJudgeConfig(),
        ...safeParseJson<JudgeConfig>(record.judgeConfig, createDefaultJudgeConfig()),
      }
    }
  } catch (error) {
    console.error('加载题目信息失败', error)
    Message.error('加载题目信息失败')
  }
}

onMounted(loadQuestion)

// ==================== 标签：动态增删 ====================
const addTag = () => {
  const value = tagInput.value.trim()
  if (!value) {
    Message.warning('请输入标签内容')
    return
  }
  if (form.tags.includes(value)) {
    Message.warning('标签已存在')
    return
  }
  form.tags.push(value)
  tagInput.value = ''
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

// ==================== 判题用例：可增删 ====================
const addCase = () => {
  form.judgeCase.push({ input: '', output: '' })
}

const removeCase = (index: number) => {
  form.judgeCase.splice(index, 1)
}

// ==================== 提交 ====================
const handleSubmit = async () => {
  // 基础校验（title / content 必填）
  if (!form.title.trim()) {
    Message.warning('请输入题目标题')
    return
  }
  if (!form.content.trim()) {
    Message.warning('请输入题目描述')
    return
  }

  // 过滤掉 input 与 output 都为空的用例行
  const judgeCase = form.judgeCase.filter((item) => item.input?.trim() || item.output?.trim())

  // 组装 QuestionAddRequest
  const questionAddRequest: QuestionAddRequest = {
    title: form.title.trim(),
    tags: form.tags,
    content: form.content,
    answer: form.answer,
    judgeConfig: { ...form.judgeConfig },
    judgeCase,
  }

  submitting.value = true
  try {
    if (isEdit) {
      // 编辑模式：复用同样的字段，额外携带 id 调用更新接口
      const questionUpdateRequest: QuestionUpdateRequest = {
        id: questionId as any,
        ...questionAddRequest,
      }
      const res = await QuestionControllerService.updateQuestionUsingPost({ questionUpdateRequest })
      if (res.code === 0) {
        Message.success('修改成功')
        // 题目内容变化，作废公开题库列表缓存，让用户端尽快看到最新题目
        clearQuestionListCache()
      } else {
        Message.error(res.message || '修改失败')
      }
    } else {
      const res = await QuestionControllerService.addQuestionUsingPost({ questionAddRequest })
      if (res.code === 0) {
        Message.success(`创建成功，题目 id：${res.data}`)
        // 新题入库，作废公开题库列表缓存（下一页/下一页可能正好出现新题）
        clearQuestionListCache()
        handleReset()
      } else {
        Message.error(res.message || '创建失败')
      }
    }
  } catch (error) {
    console.error('提交题目失败', error)
    Message.error('提交失败，请检查网络或后端服务')
  } finally {
    submitting.value = false
  }
}

// ==================== 重置 ====================
const handleReset = () => {
  Object.assign(form, createDefaultForm())
}
</script>

<style scoped>
.create-question-container {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.form-card {
  background-color: #fff;
  border-radius: 8px;
}

/* ==================== 标签编辑区 ==================== */
.tags-editor {
  width: 100%;
}
.tag-list {
  display: flex;
  margin-top: 12px;
}

/* ==================== 判题配置 ==================== */
.config-row {
  width: 100%;
}
.config-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.config-label {
  font-size: 13px;
  color: #4e5969;
}
.config-input {
  width: 100%;
}

/* ==================== 判题用例 ==================== */
.case-list {
  width: 100%;
}
.case-item {
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  background-color: #fafbfc;
}
.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.case-title {
  font-weight: 500;
  color: #1d2129;
}
</style>
