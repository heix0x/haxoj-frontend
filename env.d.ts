/*
 * @Author: hax 3152409286@qq.com
 * @Date: 2025-05-13 10:15:01
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-09-09 16:19:17
 * @FilePath: \haxoj\haxoj-frontend\env.d.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/// <reference types="vite/client" />

/** 自定义环境变量类型声明 */
interface ImportMetaEnv {
  /** 后端 API 基础地址（不带 /api，service 路径自带） */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * @bytemd/vue-next 自带的类型声明有缺陷（把 DefineComponent 类型当作值导出），
 * 在 verbatimModuleSyntax 严格模式下会导致 TS1484 错误，
 * 此处手动声明模块类型进行覆盖
 */
declare module '@bytemd/vue-next' {
  import type { Component } from 'vue'
  export const Editor: Component
  export const Viewer: Component
}
