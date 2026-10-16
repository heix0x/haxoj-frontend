# API 代码生成说明

## 📝 重要说明

`openapi-typescript-codegen` 会从后端 Swagger 文档生成代码，生成的 `OpenAPI.ts` 中的 `BASE` 会包含后端的 `servers` 配置（通常是 `http://localhost:8101/api`）。

**生成的 Service 文件中的 API 路径是不包含 basePath 的**，例如 `/user/login`。

## ⚠️ 重复路径问题

如果你发现 API 请求路径重复（如 `/api/api/user/login`），需要检查：

1. **检查 `.env` 文件**：`VITE_API_BASE_URL` 的值
2. **检查后端 Swagger 文档**：访问 `http://localhost:8101/api/v2/api-docs`，查看 `servers` 配置

## 🔧 解决方案

### 方案一：修改 `.env` 文件（推荐）

打开 `.env` 文件，修改 `VITE_API_BASE_URL`：

```bash
# 正确配置（去掉 /api 后缀）
VITE_API_BASE_URL=http://localhost:8101

# 如果后端 Swagger servers 是完整的 URL，去掉 /api
# VITE_API_BASE_URL=http://api.yourdomain.com
```

### 方案二：重新生成代码时指定 base URL

生成代码时指定正确的 base URL：

```bash
npx openapi-typescript-codegen \
  --input http://localhost:8101/api/v2/api-docs \
  --output src/api \
  --client axios \
  --useOptions \
  --useUnionTypes \
  --request ./path/to/request.ts
```

## 📋 重新生成代码的步骤

1. **确保后端正在运行**
   ```bash
   cd haxoj-backend
   mvn spring-boot:run
   ```

2. **修改 `.env` 文件**
   ```bash
   VITE_API_BASE_URL=http://localhost:8101
   ```

3. **删除旧的 API 代码**（可选）
   ```bash
   rm -rf src/api/services/*
   rm -rf src/api/models/*
   ```

4. **重新生成代码**
   ```bash
   npm run api:generate
   ```

   或者手动执行：
   ```bash
   npx openapi-typescript-codegen \
     --input http://localhost:8101/api/v2/api-docs \
     --output src/api \
     --client axios
   ```

5. **验证 `OpenAPI.ts`**
   ```typescript
   // 确保 BASE 不包含 /api 后缀
   BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8101',
   ```

## 🎯 最终的 API 请求路径

| 配置项 | 值 |
|--------|-----|
| `.env` 中的 `VITE_API_BASE_URL` | `http://localhost:8101` |
| Service 中的路径 | `/api/user/login` |
| **最终请求** | `http://localhost:8101/api/user/login` ✅ |

## 💡 提示

- `.env` 文件不会被提交到 Git（已在 `.gitignore` 中）
- 开发环境和生产环境可以使用不同的 `VITE_API_BASE_URL`
- 如果不确定后端的 Swagger 配置，先访问 `http://localhost:8101/api/v2/api-docs` 查看
