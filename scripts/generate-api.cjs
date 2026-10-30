/**
 * 从 .api-tmp/ 里的多份 Swagger 文档生成前端 API 代码，并合并到 src/api
 *
 * 为什么要自己合并：
 *   openapi-typescript-codegen 一次只吃一份 spec，且会整体重建输出目录。
 *   两个服务各生成一次到临时目录，再按文件合并，才能既保持"生成"语义、又不丢任何一个服务的接口。
 *
 * 合并规则（都是"宁可失败也不静默覆盖"）：
 *   - 同名 model / service 文件：内容一致则保留一份，不一致直接报错（说明两个服务的同名 DTO 已经漂移）
 *   - core/：各服务产物除 OpenAPI.ts 外应完全一致；OpenAPI.ts 的 BASE 必然不同，由 postprocess 统一改写
 *   - index.ts：按合并后的目录重新生成，不依赖任何一份临时产物
 *
 * 注意：本脚本不做"删除目录"的动作。
 *   开发环境里 fs.rmSync 可能被外部工具接管（移入回收站），删目录会失败；
 *   因此每次生成到唯一目录，src/api 采用"覆盖写 + 逐个 unlink 清理旧文件"，失败只告警不中断。
 *
 * 前置：先跑 scripts/fetch-api-docs.cjs（npm run api:download）
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TMP_DIR = path.join(ROOT, '.api-tmp')
const API_DIR = path.join(ROOT, 'src', 'api')
const RUN_ID = Date.now().toString(36)

function readManifest() {
  const manifestFile = path.join(TMP_DIR, 'manifest.json')
  if (!fs.existsSync(manifestFile)) {
    throw new Error('未找到 .api-tmp/manifest.json，请先执行 npm run api:download')
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'))
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('.api-tmp/manifest.json 内容为空')
  }
  return manifest
}

function runCodegen(inputFile, outputDir, label) {
  console.log(`[api:generate] 生成 ${label} ...`)
  const command =
    `npx openapi-typescript-codegen --input "${inputFile}" --output "${outputDir}" ` +
    `--client axios --useOptions`
  execSync(command, { cwd: ROOT, stdio: 'inherit' })
}

function listTsFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.ts'))
    .sort()
}

function readDirMap(dir) {
  const map = new Map()
  for (const file of listTsFiles(dir)) {
    map.set(file, fs.readFileSync(path.join(dir, file), 'utf-8'))
  }
  return map
}

/** 尽力删除目录下的文件；失败只告警（某些环境的删除会被拦截） */
function clearDirFiles(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) continue // models/services/core 都只有一层文件
    try {
      fs.unlinkSync(path.join(dir, entry.name))
    } catch (error) {
      console.warn(`[api:generate] 无法删除旧文件 ${path.join(dir, entry.name)}：${error.message}`)
    }
  }
}

function mergeDirs(sourceDirs, destDir, category) {
  const merged = new Map()
  for (const dir of sourceDirs) {
    for (const [file, content] of readDirMap(dir)) {
      const existing = merged.get(file)
      if (existing && existing.content !== content) {
        throw new Error(
          `同名 ${category} 文件内容不一致：${file}\n` +
            `  A: ${existing.from}\n  B: ${dir}\n` +
            `  → 两个服务的同名类型已经漂移，请人工确认后再合并（脚本不会替你选一个）`,
        )
      }
      if (!existing) merged.set(file, { content, from: dir })
    }
  }
  fs.mkdirSync(destDir, { recursive: true })
  for (const [file, item] of merged) {
    fs.writeFileSync(path.join(destDir, file), item.content, 'utf-8')
  }
  // 返回"不带扩展名的名字"：index.ts 的 export 语句与路径断言都用它
  return [...merged.keys()].map((file) => file.replace(/\.ts$/, '')).sort()
}

function copyCore(sourceDirs, destDir) {
  const [first, ...rest] = sourceDirs
  const firstMap = readDirMap(first)
  // OpenAPI.ts 的 BASE 来自各自 spec 的 host/basePath（8101/api 与 8102/api 必然不同），
  // 属于预期差异；postprocess-api.cjs 随后会把它改写成读 env 的写法。
  const ignoreDiff = new Set(['OpenAPI.ts'])
  for (const dir of rest) {
    for (const [file, content] of readDirMap(dir)) {
      const base = firstMap.get(file)
      if (!base) {
        console.warn(`[api:generate] 注意：${path.basename(dir)} 的 core/${file} 在其它产物中不存在，已忽略`)
      } else if (base !== content && !ignoreDiff.has(file)) {
        console.warn(`[api:generate] 注意：各产物 core/${file} 不一致，以第一个产物为准`)
      }
    }
  }
  fs.mkdirSync(destDir, { recursive: true })
  for (const [file, content] of firstMap) {
    fs.writeFileSync(path.join(destDir, file), content, 'utf-8')
  }
}

function writeIndex(models, services) {
  const lines = [
    '/* generated using openapi-typescript-codegen -- do not edit */',
    '/* istanbul ignore file */',
    '/* tslint:disable */',
    '/* eslint-disable */',
    `export { ApiError } from './core/ApiError';`,
    `export { CancelablePromise, CancelError } from './core/CancelablePromise';`,
    `export { OpenAPI } from './core/OpenAPI';`,
    `export type { OpenAPIConfig } from './core/OpenAPI';`,
    '',
  ]
  for (const model of models) {
    lines.push(`export type { ${model} } from './models/${model}';`)
  }
  lines.push('')
  for (const service of services) {
    lines.push(`export { ${service} } from './services/${service}';`)
  }
  lines.push('')
  fs.writeFileSync(path.join(API_DIR, 'index.ts'), lines.join('\n'), 'utf-8')
}

/**
 * 所有生成的请求路径都必须以 /api 开头。
 * 这条断言防的是一次具体事故：换用网关文档重新生成后，paths 少了 context-path，
 * 全站请求变成 http://localhost:8001/question/add（404）。宁可在生成阶段失败。
 */
function assertApiPrefix(services) {
  const bad = []
  for (const service of services) {
    const file = path.join(API_DIR, 'services', `${service}.ts`)
    const content = fs.readFileSync(file, 'utf-8')
    const urls = [...content.matchAll(/url:\s*'([^']+)'/g)].map((match) => match[1])
    for (const url of urls) {
      if (!url.startsWith('/api/')) bad.push(`${service}: ${url}`)
    }
  }
  if (bad.length > 0) {
    throw new Error(
      `生成的请求路径缺少 /api 前缀（会在网关处 404）：\n  ${bad.join('\n  ')}\n` +
        `  → 检查后端 Swagger 的 paths 是否包含 context-path=/api`,
    )
  }
}

function main() {
  const manifest = readManifest()

  // 1) 各服务单独生成到唯一临时目录（不删旧目录，避免删除被拦截）
  const outputDirs = []
  for (const item of manifest) {
    const outDir = path.join(TMP_DIR, `out-${RUN_ID}-${item.key}`)
    runCodegen(item.file, outDir, item.name)
    outputDirs.push({ key: item.key, dir: outDir })
  }

  // 2) 记录旧产物，便于报告"这次删了什么"
  const beforeModels = listTsFiles(path.join(API_DIR, 'models'))
  const beforeServices = listTsFiles(path.join(API_DIR, 'services'))

  // 3) 清理旧文件后合并（保留目录本身，只清文件）
  for (const dir of ['models', 'services', 'core']) {
    clearDirFiles(path.join(API_DIR, dir))
  }
  const models = mergeDirs(
    outputDirs.map((item) => path.join(item.dir, 'models')),
    path.join(API_DIR, 'models'),
    'model',
  )
  const services = mergeDirs(
    outputDirs.map((item) => path.join(item.dir, 'services')),
    path.join(API_DIR, 'services'),
    'service',
  )
  copyCore(
    outputDirs.map((item) => path.join(item.dir, 'core')),
    path.join(API_DIR, 'core'),
  )
  writeIndex(models, services)
  assertApiPrefix(services)

  // 4) 报告差异，方便 review
  const removedModels = beforeModels
    .map((file) => file.replace(/\.ts$/, ''))
    .filter((name) => !models.includes(name))
  const removedServices = beforeServices
    .map((file) => file.replace(/\.ts$/, ''))
    .filter((name) => !services.includes(name))

  console.log(`[api:generate] models=${models.length} services=${services.length}`)
  console.log(`[api:generate] 移除 model：${removedModels.join(', ') || '无'}`)
  console.log(`[api:generate] 移除 service：${removedServices.join(', ') || '无'}`)

  cleanup(outputDirs.map((item) => item.dir))

  // 后处理必须在这里做，而不是只写在 npm script 里：
  // 生成器的原始 BASE 是「服务 host + basePath」，即 http://localhost:8101/api，
  // 与 paths 自带的 /api 会拼成 /api/api/...，全站 404。
  // 单独执行本脚本（调试时很常见）也必须得到可用产物，不能留一个"能编译但全站 404"的状态。
  require('./postprocess-api.cjs')
  console.log('[api:generate] 完成')
}

/**
 * 清理本次的临时生成目录（尽力而为）。
 * 某些环境的删除会被接管成"移入回收站"，对目录可能失败——那也不该让生成失败，
 * 临时目录已在 .gitignore 里，留着不影响构建。
 */
function removeTree(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      removeTree(target)
    } else {
      fs.unlinkSync(target)
    }
  }
  fs.rmdirSync(dir)
}

function cleanup(dirs) {
  for (const dir of dirs) {
    // 先递归删文件（unlink 通常可用），再删空目录；
    // 即使删目录失败，也只剩空目录，不影响下次运行（每次都用唯一目录名）
    try {
      removeTree(dir)
    } catch (error) {
      console.warn(`[api:generate] 临时目录未完全清理（可手动删除）：${dir}（${error.message}）`)
    }
  }
}

try {
  main()
} catch (error) {
  console.error(`[api:generate] 失败：${error.message}`)
  console.error('[api:generate] 如需回退：git checkout -- src/api')
  process.exit(1)
}
