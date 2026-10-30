/**
 * 拉取各服务的 Swagger 文档到 .api-tmp/
 *
 * 为什么直连服务端口，而不是用网关的聚合文档？
 *   knife4j 网关（strategy: discover）只把每个服务的文档按 group 暴露出来，
 *   本身没有"合并成一份 spec"的能力（starter 里只有 /v2/api-docs?group= 这类路径，没有对应 Controller）。
 *   而且经网关取回的 spec 里 paths 是否还带 context-path 的 /api 前缀，取决于转发细节，
 *   一旦丢了前缀，生成的请求地址会全站少一层 /api。
 *   直连各服务端口，拿到的就是服务自己发布的文档，产物与现有代码一致。
 *
 * 地址可用环境变量覆盖（换端口/换机器时不用改脚本）：
 *   API_DOC_USER_URL / API_DOC_QUESTION_URL
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TMP_DIR = path.join(ROOT, '.api-tmp')

const SOURCES = [
  {
    key: 'user',
    name: 'user-service',
    url: process.env.API_DOC_USER_URL || 'http://localhost:8101/api/v2/api-docs?group=default',
  },
  {
    key: 'question',
    name: 'question-service',
    url: process.env.API_DOC_QUESTION_URL || 'http://localhost:8102/api/v2/api-docs?group=default',
  },
]

async function fetchSpec(source) {
  let response
  try {
    response = await fetch(source.url)
  } catch (error) {
    throw new Error(
      `${source.name} 不可达（${source.url}）：${error.message}\n` +
        `  → 请先启动 ${source.name}，或用环境变量覆盖地址`,
    )
  }
  if (!response.ok) {
    throw new Error(`${source.name} 返回 HTTP ${response.status}（${source.url}）`)
  }
  const spec = await response.json()
  // 只认 Swagger 2.0：本项目的 knife4j 用的是 openapi2（springfox），字段是 swagger/paths/definitions
  if (!spec || spec.swagger !== '2.0' || !spec.paths) {
    throw new Error(`${source.name} 返回的不是 Swagger 2.0 文档（缺少 swagger=2.0 / paths）`)
  }
  return spec
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true })
  const manifest = []

  for (const source of SOURCES) {
    const spec = await fetchSpec(source)
    const file = path.join(TMP_DIR, `${source.key}.json`)
    fs.writeFileSync(file, JSON.stringify(spec, null, 2), 'utf-8')
    const pathCount = Object.keys(spec.paths || {}).length
    const definitionCount = Object.keys(spec.definitions || {}).length
    manifest.push({ key: source.key, name: source.name, file, pathCount, definitionCount })
    console.log(
      `[api:download] ${source.name}: paths=${pathCount}, definitions=${definitionCount} → ${path.relative(ROOT, file)}`,
    )
  }

  // 生成阶段据此决定合并顺序，避免服务列表在两个脚本里各写一份
  fs.writeFileSync(path.join(TMP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')
  console.log('[api:download] 完成')
}

main().catch((error) => {
  console.error(`[api:download] 失败：${error.message}`)
  process.exit(1)
})
