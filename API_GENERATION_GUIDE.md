# API 代码生成说明

> `src/api` 全部由后端 Swagger 文档生成。这份文档说明**现在怎么生成、为什么这么设计、出错怎么查**。
> 最后更新：2026-10-30。

## 1. 现在的链路

```bash
# 前置：user-service(8101) 与 question-service(8102) 已启动
npm run api:generate
```

这条命令内部是三件事（后处理已经内置在 generate 里，不需要单独执行）：

```
api:download   scripts/fetch-api-docs.cjs     拉 8101 / 8102 两份 Swagger → .api-tmp/
generate       scripts/generate-api.cjs       两份 spec 各生成一次到临时目录 → 合并进 src/api
               └─ 结束时自动调用 postprocess：OpenAPI.ts 的 BASE 改为读 env、WITH_CREDENTIALS=true
```

> **单独执行 `node scripts/generate-api.cjs` 也是安全的**——后处理写在脚本内部。
> 这一点是踩过坑才补上的：早先后处理只挂在 npm script 上，调试时单独跑一次生成，
> 就会把 `BASE` 还原成生成器的原始值 `http://localhost:8101/api`，
> 于是所有请求变成 `/api/api/...`，全站 404，而且编译、类型检查全都正常，很难第一时间想到。

也可以分开执行：`npm run api:download` 只拉文档、不覆盖 `src/api`，适合先看看后端有没有加新接口。

## 2. 为什么不用网关的聚合文档

后端网关用 knife4j 的 `discover` 策略把各服务文档聚合到 `/doc.html`，但那是**给人看的浏览入口**：
它按 group 分别暴露每个服务的文档（`/v2/api-docs?group=<服务>`），本身不产出"合并后的一份 spec"
（starter 的字节码里只有这些分组路径，没有对应的 Controller）。

如果强行从网关取，还会多两个不确定：

1. paths 是否仍带 `context-path` 的 `/api` 前缀——丢了的话，生成的请求会变成 `http://localhost:8001/question/add`，全站 404；
2. group 名到底是 Nacos 服务名还是别的。

所以脚本**直连各服务端口**，拿到的就是服务自己发布的文档，产物与既有代码形态一致。
网关继续只承担"人看文档"的职责。

## 3. 合并规则（宁可失败，也不静默覆盖）

| 内容 | 规则 |
|---|---|
| `models/`、`services/` | 按文件名合并；**同名但内容不同直接报错**（说明两个服务的同名 DTO 已经漂移，需要人工确认） |
| `core/` | 取第一个服务的产物；`OpenAPI.ts` 的 `BASE` 各服务必然不同，属预期差异，由 postprocess 统一改写 |
| `index.ts` | 按合并后的目录重新生成，不依赖任何一份临时产物 |

脚本还会断言：**所有生成的 `url` 必须以 `/api/` 开头**。
这是针对上面第 1 个不确定性的硬护栏——真出现前缀丢失，在生成阶段就失败，而不是等用户点穿全站。

## 4. 两个容易踩的点

### 4.1 paths 带 `/api`，basePath 也是 `/api`

后端 `context-path: /api`，Swagger 里 `basePath=/api` 且 `paths` 也写成 `/api/user/login`。
生成器会把 `basePath` 塞进 `OpenAPI.BASE`，于是默认产物是 `BASE: 'http://localhost:8101/api'` + `url: '/api/user/login'`
→ 拼出双 `/api`。

`postprocess-api.cjs` 把它改成：

```ts
BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'
```

`.env` 里的 `VITE_API_BASE_URL` 指向网关且**不带 `/api`**，因此最终地址是 `http://localhost:8001/api/user/login`。

### 4.2 生成器是"整体重建"，不是"增量更新"

每次生成都会清空 `src/api` 的 `core`/`models`/`services` 并重写。由此有两条纪律：

- **手写文件不要放进 `src/api`**（会被删）。已有的手写逻辑都放在 `src/plugins`、`src/utils`。
- 后端加了接口就要重新生成；忘了生成的话，前端编译会报"没有这个属性"。

## 5. 换环境 / 换端口

两个地址可用环境变量覆盖，不用改脚本：

```bash
API_DOC_USER_URL=http://192.168.1.10:8101/api/v2/api-docs?group=default
API_DOC_QUESTION_URL=http://192.168.1.10:8102/api/v2/api-docs?group=default
```

## 6. 生成后必须做的验证

```bash
npm run type-check      # 生成产物与页面代码的类型是否还对得上
npm run build-only      # 打包是否正常（Monaco 等大依赖走懒加载）

git status --short src/api
```

`src/api` 的差异应当只有两类：

- **删除**已经不存在于后端的接口（例如上一轮清掉的 `Post*` / `WxMp*` 死代码）；
- **修改/新增**与本次后端改动对应的文件。

如果出现大量无关文件的删除或重命名，说明拉错了文档或合并逻辑有问题，用 `git checkout -- src/api` 回退。

## 7. 排错

| 现象 | 原因 | 处理 |
|---|---|---|
| 浏览器里请求路径是 `/api/api/...`，返回 Spring 的 404 JSON | `OpenAPI.ts` 的 `BASE` 被还原成生成器原值（含 `/api`） | 重跑 `npm run api:generate`；确认 `BASE` 是 `import.meta.env.VITE_API_BASE_URL \|\| 'http://localhost:8001'` |
| `xxx-service 不可达` | 服务没启动 / 端口不对 | 启动对应服务，或用环境变量改地址 |
| `返回的不是 Swagger 2.0 文档` | 地址指到了 OpenAPI 3 或非文档接口 | 检查 URL，本项目后端是 springfox(swagger 2.0) |
| `生成的请求路径缺少 /api 前缀` | 文档来源不对（如经网关取回） | 改用服务端口直连；不要从网关拉 |
| `同名 model 文件内容不一致` | 两个服务的同名 DTO 已漂移 | 人工对比两份 spec 的 `definitions`，确认保留哪份 |
| 生成后页面报"没有这个属性" | 后端加了接口但前端没重新生成，或反之 | 重跑 `npm run api:generate`，再 `type-check` |
