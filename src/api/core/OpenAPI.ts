/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions'

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>
type Headers = Record<string, string>

export type OpenAPIConfig = {
  BASE: string
  VERSION: string
  WITH_CREDENTIALS: boolean
  CREDENTIALS: 'include' | 'omit' | 'same-origin'
  TOKEN?: string | Resolver<string> | undefined
  USERNAME?: string | Resolver<string> | undefined
  PASSWORD?: string | Resolver<string> | undefined
  HEADERS?: Headers | Resolver<Headers> | undefined
  ENCODE_PATH?: ((path: string) => string) | undefined
}

export const OpenAPI: OpenAPIConfig = {
  BASE: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8101',
  VERSION: '1.0',
  WITH_CREDENTIALS: true, // 让生成的 service 请求真正携带 Cookie （后端 session 登录态依赖，跨域时必须显式开启）
  CREDENTIALS: 'include',
  TOKEN: undefined,
  USERNAME: undefined,
  PASSWORD: undefined,
  HEADERS: undefined,
  ENCODE_PATH: undefined,
}
