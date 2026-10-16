/**
 * 题库列表（脱敏 VO）的模块级短时缓存
 *
 * 为什么单独抽成一个 util 而不是写在 Problems.vue 里：
 *   缓存需要被多个页面共享——
 *   - 题库列表页：读缓存，避免翻页/来回跳转时重复请求
 *   - 做题页：用户提交代码成功后，列表里的"通过率"已过期 → 主动清缓存
 *   - 题目管理页：管理员新增/修改/删除题目后，公开列表已过期 → 主动清缓存
 *   只有把 Map 放在独立模块里，懒加载的不同页面 chunk 才能拿到同一个实例
 *
 * 注意：这是内存缓存，F5 刷新整页后自动清空，不会长期残留脏数据。
 */

/** 单条缓存：数据 + 总条数 + 过期时间点 */
export interface QuestionListCacheItem<T> {
  data: T
  total: number
  expireAt: number
}

// 缓存有效期：2 分钟。
// 题库列表的通过率会随他人提交而变化，TTL 不宜过长；
// 觉得数据更新频繁可调小（如 30 * 1000），觉得列表基本不变可调大
const CACHE_TTL = 2 * 60 * 1000

const cache = new Map<string, QuestionListCacheItem<unknown>>()

/**
 * 读取有效缓存；不存在或已过期返回 undefined（过期项顺手删除）
 */
export const getQuestionListCache = <T>(key: string): QuestionListCacheItem<T> | undefined => {
  const item = cache.get(key) as QuestionListCacheItem<T> | undefined
  if (!item) return undefined
  if (item.expireAt <= Date.now()) {
    cache.delete(key)
    return undefined
  }
  return item
}

/** 写入缓存，过期时间 = 当前时间 + TTL */
export const setQuestionListCache = <T>(key: string, data: T, total: number): void => {
  cache.set(key, { data, total, expireAt: Date.now() + CACHE_TTL })
}

/**
 * 作废全部题库列表缓存。
 * 在"确定题目数据已变化"的操作成功后调用：提交代码、管理员增删改题目。
 * 作废后下次进入题库会重新请求，保证用户看到的是最新数据。
 */
export const clearQuestionListCache = (): void => {
  cache.clear()
}
