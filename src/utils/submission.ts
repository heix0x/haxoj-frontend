/**
 * 提交记录相关的展示工具
 *
 * 为什么单独抽出来：
 *   状态文案、判题结论的中文映射、内存/耗时格式化，提交记录页和做题页都要用；
 *   散在两个页面里迟早会出现「一边显示 Accepted、一边显示 成功」的口径分裂。
 */

/** 后端 QuestionSubmitStatusEnum 的取值（不要在前端写魔法数字） */
export const SUBMISSION_STATUS = {
  WAITING: 0,
  RUNNING: 1,
  SUCCEED: 2,
  FAILED: 3,
} as const

/** 状态 → 列表标签的文案与颜色（Arco tag 支持的 color 名） */
const STATUS_PRESENTATION: Record<number, { text: string; color: string }> = {
  0: { text: '待判题', color: 'gray' },
  1: { text: '判题中', color: 'arcoblue' },
  2: { text: '成功', color: 'green' },
  3: { text: '失败', color: 'red' },
}

/**
 * 判题结论的中文映射。
 * 后端 judgeInfo.message 存的是 JudgeInfoMessageEnum 的 value（英文），
 * 直接展示会给中文界面插一排英文，这里统一翻译；未知文案原样返回。
 */
const JUDGE_MESSAGE_TEXT: Record<string, string> = {
  Accepted: '成功',
  'Wrong Answer': '答案错误',
  'Compile Error': '编译错误',
  'Memory Limit Exceeded': '内存溢出',
  'Time Limit Exceeded': '超时',
  'Runtime Error': '运行错误',
  'System Error': '系统错误',
  'Presentation Error': '展示错误',
  'Output Limit Exceeded': '输出溢出',
  'Dangerous Operation': '危险操作',
}

/** 是否处于未出结果的中间态（这两种状态才需要轮询刷新） */
export const isPendingStatus = (status?: number): boolean =>
  status === SUBMISSION_STATUS.WAITING || status === SUBMISSION_STATUS.RUNNING

/** 判题结论英文值 → 中文（未知的原样返回；空返回 '-'） */
export const translateJudgeMessage = (message?: string): string => {
  if (!message) return '-'
  return JUDGE_MESSAGE_TEXT[message] ?? message
}

/**
 * 列表/抽屉展示的状态文案。
 * 规则：中间态显示「待判题/判题中」；成功显示「成功」；
 * 失败时优先展示判题结论（答案错误/编译错误/超时…），它比一个笼统的「失败」更有用。
 */
export const getSubmissionStatusText = (record: {
  status?: number
  judgeInfo?: { message?: string } | null
}): string => {
  const status = record?.status
  if (status === SUBMISSION_STATUS.SUCCEED) {
    return STATUS_PRESENTATION[status].text
  }
  if (status === SUBMISSION_STATUS.FAILED) {
    const message = record?.judgeInfo?.message
    return (message && JUDGE_MESSAGE_TEXT[message]) || message || '失败'
  }
  return STATUS_PRESENTATION[status ?? -1]?.text ?? '未知'
}

/** 状态标签颜色 */
export const getSubmissionStatusColor = (status?: number): string =>
  STATUS_PRESENTATION[status ?? -1]?.color ?? 'gray'

/**
 * 内存格式化：后端单位 KB（沙箱已换算），超过 1MB 显示 MB 更符合阅读习惯。
 * 0 和 undefined 都显示 '-'：WAITING/RUNNING 时后端不产出内存数据，显示 0KB 会误导。
 */
export const formatMemoryKb = (kb?: number): string => {
  const value = Number(kb ?? 0)
  if (!value) return '-'
  if (value >= 1024) {
    const mb = value / 1024
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`
  }
  return `${value}KB`
}

/** 耗时格式化：后端单位 ms；0 和 undefined 显示 '-' */
export const formatDurationMs = (ms?: number): string => {
  const value = Number(ms ?? 0)
  if (!value) return '-'
  return `${value}ms`
}

/** 语言显示名：后端存的是枚举 value（java / c++ / golang） */
export const formatLanguageLabel = (language?: string): string => {
  if (!language) return '-'
  const map: Record<string, string> = { java: 'Java', 'c++': 'C++', golang: 'Go' }
  return map[language.toLowerCase()] ?? language
}

/** 语言 → Monaco 的语言 id（详情抽屉里做语法高亮用） */
export const getMonacoLanguage = (language?: string): string => {
  switch ((language ?? '').toLowerCase()) {
    case 'java':
      return 'java'
    case 'c++':
    case 'cpp':
      return 'cpp'
    case 'golang':
    case 'go':
      return 'go'
    default:
      return 'plaintext'
  }
}
