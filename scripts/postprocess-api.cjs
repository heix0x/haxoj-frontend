/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2026-09-09 15:30:55
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-09-11 20:45:07
 * @FilePath: \haxoj\haxoj-frontend\scripts\postprocess-api.cjs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * api:generate 后置处理脚本
 *
 * 背景：openapi-typescript-codegen 每次生成会清空并重建 src/api 的 core/models/services，
 * 导致两类"人肉改动"丢失：
 *   1. src/api 下手写的文件被删除 → 解法：手写文件一律不放 src/api（已迁移到 src/plugins 等）
 *   2. 生成文件中的默认值不符合本项目 → 解法：在本脚本中幂等修补
 *
 * 当前修补项：
 *   1. src/api/core/OpenAPI.ts 的 BASE
 *      生成器会输出硬编码 BASE（形如 BASE: 'http://localhost:8101/api'），
 *      其中 /api 与 service 路径自带的 /api 前缀会拼成 双 /api 请求路径，
 *      需替换为读取 .env 的 VITE_API_BASE_URL（值为 http://localhost:8001，不带 /api，指向网关）。
 *   2. src/api/core/OpenAPI.ts 的 WITH_CREDENTIALS
 *      生成器默认输出 false，而 request.ts 会以「单请求级」withCredentials 传给 axios，
 *      会覆盖 src/plugins/axios.ts 里设置的全局 true。
 *      前端(5173)与后端(网关 8001)跨域，凭证为 false 时浏览器不会携带/保存 Cookie，
 *      后端基于 Session 的登录态将无法建立与维持，故需强制改为 true。
 *
 * 本脚本幂等：已修复则跳过，可反复执行。
 */
const fs = require('fs')
const path = require('path')

const openApiFile = path.join(__dirname, '..', 'src', 'api', 'core', 'OpenAPI.ts')

function patchOpenApiBase() {
  if (!fs.existsSync(openApiFile)) {
    console.warn('[postprocess] 未找到 OpenAPI.ts，跳过 BASE 修补')
    return
  }
  const content = fs.readFileSync(openApiFile, 'utf-8')
  const marker = 'import.meta.env.VITE_API_BASE_URL'
  if (content.includes(marker)) {
    console.log('[postprocess] OpenAPI.ts BASE 已使用 env，跳过')
    return
  }
  const patched = content.replace(/BASE: '[^']*',/, `BASE: ${marker} || 'http://localhost:8001',`)
  if (patched === content) {
    console.warn('[postprocess] 未匹配到 BASE 行，请手动检查 OpenAPI.ts')
    return
  }
  fs.writeFileSync(openApiFile, patched)
  console.log('[postprocess] OpenAPI.ts BASE 已替换为 env 写法')
}

function patchWithCredentials() {
  if (!fs.existsSync(openApiFile)) {
    console.warn('[postprocess] 未找到 OpenAPI.ts，跳过 WITH_CREDENTIALS 修补')
    return
  }
  const content = fs.readFileSync(openApiFile, 'utf-8')
  if (content.includes('WITH_CREDENTIALS: true')) {
    console.log('[postprocess] OpenAPI.ts WITH_CREDENTIALS 已为 true，跳过')
    return
  }
  const patched = content.replace('WITH_CREDENTIALS: false', 'WITH_CREDENTIALS: true')
  if (patched === content) {
    console.warn('[postprocess] 未匹配到 WITH_CREDENTIALS 行，请手动检查 OpenAPI.ts')
    return
  }
  fs.writeFileSync(openApiFile, patched)
  console.log('[postprocess] OpenAPI.ts WITH_CREDENTIALS 已替换为 true')
}

patchOpenApiBase()
patchWithCredentials()
