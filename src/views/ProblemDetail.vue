<!--
 * @Description: 做题页（/problems/:id）
 * 布局：左右分栏
 *   左侧：题目标题 / 标签 / 判题限制 / 通过率 / Markdown 题面（ByteMD Viewer 只读渲染）
 *   右侧：编程语言选择 + Monaco 代码编辑器 + 提交按钮
 *   窄屏（< 992px）时左右两栏自动堆叠为上下排列
 * 数据：getQuestionVOById（脱敏 VO，不包含 answer / judgeCase）
 * 提交：/question_submit/（需登录，未登录时后端返回 401，由 axios 拦截器统一跳登录）
-->
<template>
  <div class="problem-detail-container">
    <!-- ==================== 加载中 ==================== -->
    <div v-if="loading" class="state-wrap">
      <a-spin tip="题目加载中..." :size="32" />
    </div>

    <!-- ==================== 加载失败 / 题目不存在 ==================== -->
    <a-result
      v-else-if="!question"
      status="error"
      title="题目加载失败"
      :subtitle="loadError || '题目不存在或已被删除'"
    >
      <template #extra>
        <a-space>
          <a-button type="primary" @click="loadQuestion">重试</a-button>
          <a-button @click="router.push('/problems')">返回题库</a-button>
        </a-space>
      </template>
    </a-result>

    <!-- ==================== 题目内容 + 代码区 ==================== -->
    <a-row v-else :gutter="16" class="detail-row">
      <!-- ---------- 左侧：题目信息 ---------- -->
      <a-col :xs="24" :lg="12" class="detail-col">
        <a-card :bordered="false" class="detail-card question-card">
          <template #title>
            <div class="question-header">
              <a-button type="text" size="small" class="back-btn" @click="router.push('/problems')">
                <template #icon><icon-left /></template>
                题库
              </a-button>
              <span class="question-title">{{ question.title }}</span>
            </div>
          </template>

          <!-- 元信息：标签 / 判题限制 / 通过率 -->
          <div class="meta-section">
            <div class="meta-row">
              <span class="meta-label">标签：</span>
              <a-space wrap :size="4">
                <a-tag v-for="tag in question.tagList" :key="tag" color="arcoblue">{{ tag }}</a-tag>
                <span v-if="!question.tagList?.length" class="empty-text">暂无</span>
              </a-space>
            </div>
            <div class="meta-row">
              <span class="meta-label">判题限制：</span>
              <a-space wrap :size="4">
                <a-tag v-if="question.judgeConfig?.timeLimit" color="green">
                  时间 {{ question.judgeConfig.timeLimit }}ms
                </a-tag>
                <a-tag v-if="question.judgeConfig?.memoryLimit" color="orange">
                  内存 {{ formatMemory(question.judgeConfig.memoryLimit) }}
                </a-tag>
                <a-tag v-if="question.judgeConfig?.stackLimit" color="purple">
                  栈 {{ formatMemory(question.judgeConfig.stackLimit) }}
                </a-tag>
              </a-space>
            </div>
            <div class="meta-row">
              <span class="meta-label">通过率：</span>
              <span
                class="rate"
                :class="getAcceptRateClass(question.acceptedNum, question.submitNum)"
              >
                {{ getAcceptRate(question.acceptedNum, question.submitNum) }}%
              </span>
              <span class="ratio"
                >({{ question.acceptedNum ?? 0 }}/{{ question.submitNum ?? 0 }})</span
              >
            </div>
          </div>

          <a-divider class="meta-divider" />

          <!-- 题面：Markdown 只读渲染 -->
          <Viewer
            :value="question.content || '暂无题目描述'"
            :plugins="mdPlugins"
            class="md-viewer"
          />
        </a-card>
      </a-col>

      <!-- ---------- 右侧：代码编辑与提交 ---------- -->
      <a-col :xs="24" :lg="12" class="detail-col">
        <a-card :bordered="false" class="detail-card editor-card">
          <template #title>
            <span>提交代码</span>
          </template>
          <template #extra>
            <a-select v-model="language" style="width: 140px" :options="languageOptions" />
          </template>

          <MonacoEditor v-model="code" :language="monacoLanguage" height="520px" />

          <!-- 底部操作栏 -->
          <div class="submit-bar">
            <a-button @click="router.push('/problems')">返回题库</a-button>
            <a-button type="primary" :loading="submitting" @click="handleSubmit">
              <template #icon><icon-send /></template>
              提交代码
            </a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconLeft, IconSend } from '@arco-design/web-vue/es/icon'
import { Viewer } from '@bytemd/vue-next'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
// Viewer 与 MdEditor 分属不同的懒加载 chunk，需自行引入代码高亮主题
import 'highlight.js/styles/github.css'
import MonacoEditor from '@/components/MonacoEditor.vue'
import { QuestionControllerService, QuestionSubmitControllerService } from '@/api'
import type { QuestionVO } from '@/api'
import { getAcceptRate, getAcceptRateClass } from '@/utils/question'
import { clearQuestionListCache } from '@/utils/questionListCache'
// 内存/栈限制的 KB→MB 展示与提交记录页共用同一份实现（utils/submission）
import { formatMemoryKb as formatMemory } from '@/utils/submission'

defineOptions({
  name: 'ProblemDetail',
})

const route = useRoute()
const router = useRouter()

// Markdown 渲染插件，与编辑器侧保持一致（表格、删除线、代码高亮）
const mdPlugins = [gfm(), highlight()]

// ==================== 语言配置 ====================
// value 必须与后端 QuestionSubmitLanguageEnum 一致。
// 后端枚举里还有 c++ / golang，但代码沙箱目前只实现了 Java：
// 这两个选项放出来只会让用户提交后收到「当前仅支持 Java」的错误，所以先不展示。
// 加回多语言时，这里补选项 + 沙箱补实现，两件事要一起做。
// monaco 为 Monaco Editor 的语言 id；template 为切换语言时的初始代码骨架
interface LanguageOption {
  value: string
  label: string
  monaco: string
  template: string
}

const languageOptions: LanguageOption[] = [
  {
    value: 'java',
    label: 'Java',
    monaco: 'java',
    template: `public class Main {
    public static void main(String[] args) {

    }
}
`,
  },
]

const language = ref('java')
const code = ref(languageOptions[0].template) // ref()中的languageOptions[0].template意思是默认使用Java语言的骨架模板

// 当前语言对应的 Monaco 语言 id
const monacoLanguage = computed(
  () => languageOptions.find((item) => item.value === language.value)?.monaco ?? 'java',
)

// 切换语言：若代码为空或仍是上一种语言的骨架模板，则自动替换为新语言模板；
// 用户已写了自己的代码则保留，避免误清空。
// 用 watch 的 (新值, 旧值) 取值，不能依赖 @change 事件——a-select 的 v-model 在
// change 触发前就已更新，事件回调里读到的 language 已经是新值，拿不到旧语言
watch(language, (newValue, oldValue) => {
  const newLang = languageOptions.find((item) => item.value === newValue)
  const oldLang = languageOptions.find((item) => item.value === oldValue)
  if (!newLang) return
  if (!code.value.trim() || (oldLang && code.value === oldLang.template)) {
    code.value = newLang.template
  }
})

// ==================== 题目数据 ====================
// 路径参数 id 是 19 位雪花 ID，全程保持字符串，不要转 Number（会精度丢失）
const questionId = (route.params.id as string) || ''

const question = ref<QuestionVO>()
const loading = ref(false)
const loadError = ref('')

const loadQuestion = async () => {
  if (!questionId) {
    loadError.value = '缺少题目 ID'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    // 生成的 API 类型把 id 标成 number，但后端实际接收字符串形式的雪花 ID，这里透传即可
    const res = await QuestionControllerService.getQuestionVoByIdUsingGet({
      id: questionId as any,
    })
    if (res.code === 0 && res.data) {
      question.value = res.data
    } else {
      loadError.value = res.message || '题目不存在或已被删除'
    }
  } catch (error) {
    console.error('加载题目详情失败', error)
    loadError.value = '加载题目详情失败，请检查网络或后端服务'
  } finally {
    loading.value = false
  }
}

// ==================== 提交 ====================
const submitting = ref(false)

const handleSubmit = async () => {
  if (!code.value.trim()) {
    Message.warning('请先编写代码后再提交')
    return
  }
  submitting.value = true
  try {
    const res = await QuestionSubmitControllerService.doQuestionSubmitUsingPost({
      questionSubmitAddRequest: {
        questionId: questionId as any,
        language: language.value,
        code: code.value,
      },
    })
    if (res.code === 0) {
      Message.success('提交成功，可在顶栏「提交记录」查看判题结果')
      // 提交会改变该题的通过/提交数，作废题库列表缓存，返回列表时看到最新通过率
      clearQuestionListCache()
    } else {
      Message.error(res.message || '提交失败')
    }
  } catch (error) {
    console.error('提交代码失败', error)
    Message.error('提交失败，请检查网络或后端服务')
  } finally {
    submitting.value = false
  }
}

onMounted(loadQuestion)
</script>

<style scoped>
.problem-detail-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.state-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.detail-row {
  margin: 0 !important;
}

.detail-col {
  margin-bottom: 16px;
}

.detail-card {
  background-color: #fff;
  border-radius: 8px;
}

/* ==================== 左侧题目区 ==================== */
.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn {
  padding: 0 4px;
  flex-shrink: 0;
}

.question-title {
  font-size: 16px;
  font-weight: bold;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  line-height: 24px;
}

.meta-label {
  color: #4e5969;
  flex-shrink: 0;
}

.meta-divider {
  margin: 12px 0;
}

/* ByteMD Viewer 默认高度是按编辑器全屏设计的，只读场景改为随内容自适应 */
.md-viewer :deep(.bytemd) {
  height: auto;
  min-height: 360px;
}

.md-viewer :deep(.bytemd-body) {
  overflow: visible;
}

/* ==================== 右侧代码区 ==================== */
.submit-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

/* ==================== 通过率配色（与列表页一致） ==================== */
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

/* 窄屏减小内边距 */
@media (max-width: 768px) {
  .problem-detail-container {
    padding: 12px;
  }
}
</style>
