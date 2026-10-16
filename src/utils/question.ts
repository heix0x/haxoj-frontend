/**
 * 题目相关的通用展示工具
 * 题库列表 / 题目管理 / 做题页共用，避免同样的格式化逻辑散落在各页面
 */
import moment from 'moment'

/**
 * 格式化后端时间字段（ISO-8601 或 "yyyy-MM-dd HH:mm:ss" 字符串 moment 均可解析）
 * @param time 后端返回的时间字符串
 * @returns 统一展示为 YYYY-MM-DD HH:mm:ss；空值显示 '-'；无法解析时原样返回
 */
export const formatDateTime = (time?: string): string => {
  if (!time) return '-'
  const m = moment(time)
  return m.isValid() ? m.format('YYYY-MM-DD HH:mm:ss') : time
}

/**
 * 计算题目通过率
 * @param acceptedNum 通过数
 * @param submitNum 提交数
 * @returns 0-100 的整数（四舍五入）；提交数为 0 时返回 0，避免除零得到 NaN
 */
export const getAcceptRate = (acceptedNum?: number, submitNum?: number): number => {
  const accepted = Number(acceptedNum ?? 0)
  const submitted = Number(submitNum ?? 0)
  if (!submitted) return 0
  return Math.round((accepted / submitted) * 100)
}

/**
 * 按通过率高低返回颜色样式类（各页面的 scoped 样式中需存在同名类）
 *   >=50%  rate-high  绿
 *   20-50% rate-mid   橙
 *   <20%   rate-low    红
 *   无提交 rate-empty  灰
 */
export const getAcceptRateClass = (acceptedNum?: number, submitNum?: number): string => {
  if (!Number(submitNum ?? 0)) return 'rate-empty'
  const rate = getAcceptRate(acceptedNum, submitNum)
  if (rate >= 50) return 'rate-high'
  if (rate >= 20) return 'rate-mid'
  return 'rate-low'
}
