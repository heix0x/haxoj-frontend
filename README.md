# haxoj-frontend

在线判题系统（OJ）前端 —— 基于 Vue 3 + Vite + TypeScript 的单页应用。

## 1. 项目概述

**项目定位**：OJ 系统的 Web 前端，提供首页、题库、做题（在线代码编辑器）、比赛、排名、用户中心与管理后台等页面。

**核心功能模块**

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 站点首页 |
| 题库 | `/problems` | 题目列表（含搜索、分页、刷新） |
| 做题 | `/problems/:id` | 题目详情 + Monaco 代码编辑器 + 提交 |
| 比赛 | `/contests` | 比赛列表 |
| 排名 | `/ranking` | 排行榜 |
| 关于 | `/about` | 站点介绍 |
| 用户中心 | `/user/center` | 需登录 |
| 管理后台 | `/admin/*` | 仅管理员，含概览 / 用户管理 / 题目管理 / 创建题目等 |
| 登录 / 注册 | `/user/login`、`/user/register` | 独立无顶栏布局 |

## 2. 技术栈

以下版本均来自 `package.json`：

| 分类 | 选型 | 版本 |
| --- | --- | --- |
| 框架 | Vue | `^3.5.13` |
| 构建工具 | Vite | `^6.2.4`（`@vitejs/plugin-vue ^5.2.3`、`vite-plugin-vue-devtools ^7.7.2`） |
| 语言 | TypeScript | `~5.8.0`（类型检查用 `vue-tsc ^2.2.8`） |
| 路由 | vue-router | `^4.5.0` |
| 状态管理 | Pinia | `^3.0.1` + `pinia-plugin-persistedstate ^4.3.0` |
| UI 组件库 | Arco Design（`@arco-design/web-vue`） | `^2.57.0`（注意：声明在 `devDependencies` 中） |
| HTTP | axios | `^1.16.1` |
| 代码编辑器 | monaco-editor | `^0.56.0` |
| Markdown | ByteMD（`@bytemd/vue-next ^1.22.0` + `plugin-gfm` / `plugin-highlight`） | `^1.22.0` |
| 时间处理 | moment | `^2.30.1` |
| 接口代码生成 | openapi-typescript-codegen | `^0.30.0` |
| 代码规范 | ESLint `^9.22.0`、Prettier `3.5.3`、eslint-plugin-vue `~10.0.0` | — |
| 测试 | Vitest `^3.1.1` + `@vue/test-utils ^2.4.6` + jsdom `^26.0.0` | — |
| Node 类型 | `@types/node ^22.14.0`、`@tsconfig/node22 ^22.0.1` | 暗示 Node 22 |

## 3. 环境依赖

| 组件 | 要求 | 说明 |
| --- | --- | --- |
| Node.js | 22.x（推荐） | `@types/node ^22.14.0`、`@tsconfig/node22` |
| 包管理器 | npm | 仓库内存在 `package-lock.json`（无 yarn / pnpm 锁文件） |
| 后端服务 | 运行中的 OJ 后端 | 联调时至少需要用户 / 题目服务，判题还需代码沙箱服务 |

## 4. 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置后端地址：编辑根目录 .env
#    VITE_API_BASE_URL=http://localhost:8001

# 3. 启动开发服务器（Vite 默认 5173 端口）
npm run dev

# 4. 生产构建 / 本地预览
npm run build
npm run preview
```

**可用的 npm 脚本**

| 脚本 | 作用 |
| --- | --- |
| `dev` | 启动 Vite 开发服务器 |
| `build` | 类型检查 + 生产构建（`run-p type-check build-only`） |
| `build-only` | 仅构建，`vite build` |
| `type-check` | 类型检查，`vue-tsc --build` |
| `preview` | 本地预览已构建产物 |
| `test:unit` | 运行 Vitest 单测 |
| `lint` | ESLint 检查并修复 |
| `format` | Prettier 格式化 `src/` |
| `api:download` | 从后端拉取 OpenAPI 文档到 `api-docs.json` |
| `api:generate` | 拉取文档 → 生成 `src/api` → 执行后置修补脚本 |

## 5. 项目结构

```
haxoj-frontend/
├── .env                       # VITE_API_BASE_URL（当前指向网关 http://localhost:8001）
├── vite.config.ts             # 插件 [vue(), vueDevTools()]，别名 @ → ./src
├── scripts/postprocess-api.cjs# api:generate 后置修补（BASE 读 env、WITH_CREDENTIALS 改 true）
├── src/
│   ├── main.ts                # 应用入口
│   ├── App.vue                # 根组件（仅 <router-view />）
│   ├── api/                   # OpenAPI 自动生成的客户端（core / models / services）
│   ├── plugins/axios.ts       # 全局 axios 实例：withCredentials + 拦截器 + 登录过期跳转
│   ├── router/                # index.ts（路由实例与守卫）、routes.ts（路由表）
│   ├── stores/                # Pinia：user（用户态，持久化 key haxoj-user）
│   ├── access/                # accessEnum（NOT_LOGIN / USER / ADMIN）、checkAccess
│   ├── layouts/               # BasicLayout（顶栏 + 返回条）、UserLayout（登录注册）
│   ├── components/            # MonacoEditor、MdEditor、HaxHeader、custom-lang-monarch
│   ├── views/                 # 各页面（Home / Problems / ProblemDetail / Admin* / user/* ...）
│   ├── utils/                 # question.ts（题目格式化）、questionListCache.ts（列表缓存）
│   └── assets/                # 样式与静态资源
└── dist/                      # 构建产物（已存在于仓库）
```

**开发规范**

- 路由元信息约定见 `src/router/routes.ts` 顶部注释：`meta.title`（页面标题兼菜单文案）、`meta.access`（权限）、`meta.hideInMenu`、`meta.activeMenu`。
- **`src/api` 目录由工具生成，禁止手写文件**（会被下次 `api:generate` 清空）；手写代码放 `src/plugins`、`src/utils` 等目录。
- 管理员页面统一挂在 `/admin/*` 下（`/admin` 本身是分组路由，直接重定向到 `/admin/overview`），每个子页面有独立 URL，可刷新、可收藏。
- 雪花 ID（19 位）全程按**字符串**处理，不要转成 `Number`。

## 6. 路由与权限

- **权限模型**（`src/access/accessEnum.ts`）：`NOT_LOGIN`（任何人）/ `USER`（登录用户）/ `ADMIN`（管理员）。
- **双重控制**：菜单按 `meta.access` 过滤；`src/router/index.ts` 的全局前置守卫兜底拦截。
- **布局**：主功能页面共用父路由 `/`（`BasicLayout`，带顶栏菜单）；登录/注册走独立的 `/user`（`UserLayout`，无顶栏）。`App.vue` 只保留 `<router-view />`，避免布局重复渲染。
- **路由顺序要点**：具体路径（如 `/user/login`）必须先于通配路径定义，否则会命中错误布局；`/admin` 用 `redirect` 处理分组入口。

## 7. 与后端联调

**接口来源**：后端 Knife4j 暴露 OpenAPI 文档，前端用 `openapi-typescript-codegen` 生成 TypeScript 客户端。

```bash
npm run api:download   # 从某个后端服务直连拉文档，如 curl http://localhost:8101/api/v2/api-docs?group=default → api-docs.json（网关暂不聚合文档）
npm run api:generate    # 生成 src/api 并运行 scripts/postprocess-api.cjs
```

**两个关键约定**（后置脚本负责保证）

1. `src/api/core/OpenAPI.ts` 的 `BASE` 读取 `VITE_API_BASE_URL`（值为 `http://localhost:8001`，**不带 `/api`**）——因为生成的接口路径**自带 `/api` 前缀**（与后端各服务的 `context-path` 对应），BASE 若再带 `/api` 会拼出双 `/api`。
2. `OpenAPI.WITH_CREDENTIALS = true`：前后端跨域（前端 5173 / 后端网关 8001）时，必须携带 Cookie 才能建立并维持后端基于 Session 的登录态；生成器默认输出 `false`，脚本会强制改回 `true`。

**后端端口对应关系**（微服务版）

| 服务 | 端口 | context-path | 对外 |
| --- | --- | --- | --- |
| **网关** | **8001** | —（已配路由） | ✅ **唯一对外** |
| 用户服务 | 8101 | `/api` | ❌ 只对内 |
| 题目服务 | 8102 | `/api` | ❌ 只对内 |
| 判题服务 | 8103 | `/api` | ❌ 只对内（仅 inner 接口，网关不开路由） |

> ✅ 前端只需配**一个** `VITE_API_BASE_URL` 指向网关（8001）。网关按 `Path` 分发：`/api/user/**`、`/api/file/**` → 用户服务；`/api/question/**`、`/api/question_submit/**` → 题目服务。前端**不感知** 8101/8102/8103 —— 那些端口只在内网互调。
> 注意：网关路由**覆盖不到** `/api/inner/**`（服务间专用接口），因此 inner 接口对前端天然不可达。

## 8. 部署说明

- **构建**：`npm run build`，产物输出到 `dist/`（Vite 默认目录）。
- **托管**：`dist/` 为纯静态资源，可交给任意静态服务器托管；单页应用需配置「history 模式回退」（所有未知路径回退到 `index.html`），否则刷新子路由会 404。
- **环境变量**：`VITE_API_BASE_URL` 在**构建时**注入，生产构建前必须改成生产后端地址（`.env` 中已以注释形式预留位置）。
- **仓库现状**：前端目录内**没有** `Dockerfile`、`nginx.conf` 或 CI 配置，容器化与反向代理需自行补充。

## 9. 常见问题

| 问题 | 原因 | 解决 |
| --- | --- | --- |
| 请求路径出现双 `/api` | `VITE_API_BASE_URL` 误带了 `/api` | 保持 BASE 只到域名 + 端口，如 `http://localhost:8001` |
| 登录成功后仍显示未登录 | 跨域 Cookie 未携带 | 确认 `OpenAPI.WITH_CREDENTIALS = true` 与 axios `withCredentials`，后端需相应放开 CORS |
| 刷新子页面 404 | 静态服务器未配置 history 回退 | 配置所有路径回退 `index.html` |
| `api:generate` 后手写文件丢失 | 生成器会重建 `src/api` | 手写代码不要放进 `src/api` |
| 提交代码后题库数据不刷新 | 列表缓存未失效 | 提交/增删改后清除 `src/utils/questionListCache.ts` 的缓存（或用「刷新」按钮强刷） |
| Monaco 编辑器复制/删除异常 | 新版 EditContext API 兼容问题 | 编辑器已设置 `editContext: false`，勿移除 |
| 生成的 `Post*` / `WxMp` 接口调不到 | 这些来自旧单体后端的文档 | 微服务后端未提供对应服务，按需重新生成或忽略 |

## 10. 贡献指南

**分支与提交**

- 分支模型：`main`（稳定）→ `feature/*`、`fix/*`。
- 提交信息遵循 Conventional Commits：`feat:` / `fix:` / `refactor:` / `docs:` / `chore:`。

**PR 流程**

1. 从 `main` 切出特性分支，提交前本地跑通 `npm run lint` 与 `npm run build`。
2. 发起 PR，说明改动内容与验证方式（截图 / 操作步骤）。
3. 至少 1 名维护者 Review 通过后合并。

**约定**

- 新增依赖后同步更新 `package-lock.json`，不要提交 `node_modules`。
- 修改接口类型时通过 `npm run api:generate` 重新生成，不要手改 `src/api`。
