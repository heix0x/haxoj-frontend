<!--
 * @Author: hax 3152409286@qq.com
 * @Date: 2026-09-08 10:40:29
 * @LastEditors: hax 3152409286@qq.com
 * @LastEditTime: 2026-09-09 09:31:54
 * @FilePath: \haxoj\haxoj-frontend\src\components\MdEditor.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--
 * @Author: hax 3152409286@qq.com
 * @Description: Markdown 编辑器组件（基于 ByteMD）
 * 父子组件传值：
 * 1. 父传子（props）：modelValue —— 编辑器当前内容，由父组件通过 v-model 传入
 * 2. 子传父（emit）：update:modelValue —— 内容变化时通知父组件
 -->
<template>
  <div class="md-editor">
    <!--
      Editor 是 ByteMD 提供的编辑器组件
      :value 接收父组件传下来的内容
      @change 监听用户输入，内容一变就触发 handleChange
    -->
    <Editor
      :value="modelValue"
      :plugins="plugins"
      :placeholder="placeholder"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import { Editor } from '@bytemd/vue-next'
// 编辑器核心样式
import 'bytemd/dist/index.css'
// 代码高亮样式（配合 plugin-highlight 使用）
import 'highlight.js/styles/github.css'

/**
 * 子组件接收父组件的数据
 * defineProps：声明本组件允许父组件传入哪些属性
 * modelValue 是 Vue3 约定俗成的字段名，配合 v-model 使用
 */
defineProps<{
  modelValue: string
  placeholder?: string
}>()

/**
 * 子组件向父组件发送数据/事件
 * defineEmits：声明本组件会向父组件抛出哪些事件
 * 'update:modelValue' 也是 Vue3 的约定写法：
 * 父组件写 v-model="xxx" 时，等价于 :model-value="xxx" + @update:model-value="xxx = $event"
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 编辑器插件：gfm 支持表格、删除线等扩展语法，highlight 支持代码高亮
const plugins = [
  gfm(),
  highlight(),
  // 需要更多插件可以继续追加
]

/**
 * 编辑器内容变化时的回调
 * 用户每敲一个字，ByteMD 都会带上最新内容 v 调用本函数
 * 注意：本组件自己不保存内容，而是把 v 抛给父组件，
 * 由父组件决定怎么处理（比如存进自己的 ref、调接口保存等）
 */
const handleChange = (v: string) => {
  emit('update:modelValue', v)
}
</script>

<style scoped>
.md-editor {
  width: 100%;
}

/* 调整编辑器默认高度 */
:deep(.bytemd) {
  height: 500px;
}
</style>
