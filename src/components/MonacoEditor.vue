<!--
 * @Author: hax 3152409286@qq.com
 * @Description: 代码编辑器组件（基于 Monaco Editor，VS Code 同款内核）
 * 父子组件传值：
 * 1. 父传子（props）：modelValue —— 编辑器内容；language —— 编程语言
 * 2. 子传父（emit）：update:modelValue —— 内容变化时通知父组件
 -->
<template>
  <div ref="editorContainer" class="monaco-editor-container" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
// 引入 Monaco Editor（推荐用完整入口，而不是文章里的 editor.api 子路径）
import * as monaco from 'monaco-editor'
// 引入自定义语言 Monarch 词法定义
import customLangMonarch from '@/components/custom-lang-monarch'

/**
 * ==================== Web Worker 配置（Vite 集成的关键！）====================
 * Monaco 的智能提示、TS 类型校验等重活跑在 Worker 线程（防止卡死页面）。
 * ?worker 是 Vite 的原生语法：把该文件单独打包成一个 Worker。
 * self.MonacoEnvironment.getWorker 按语言名返回对应的 Worker 实例。
 * 不配置的话，Monaco 会去 CDN 加载 Worker，网络不好时编辑器功能直接失灵。
 */
import editorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import jsonWorker from 'monaco-editor/language/json/json.worker.js?worker'
import cssWorker from 'monaco-editor/language/css/css.worker.js?worker'
import htmlWorker from 'monaco-editor/language/html/html.worker.js?worker'
import tsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    // label 就是编辑器当前的 language 名，按需分发对应 Worker
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    // java / cpp / golang / custom 等语言只需主线程的 Monarch 高亮，用通用 Worker 兜底
    return new editorWorker()
  },
}

/**
 * ==================== 注册自定义语言（文章示例核心）====================
 * 两步走：
 * 1. register：告诉 Monaco "世界上有一门叫 custom 的语言"
 * 2. setMonarchTokensProvider：把 Monarch 词法规则绑定到这门语言
 */
monaco.languages.register({ id: 'custom' })
monaco.languages.setMonarchTokensProvider('custom', customLangMonarch)

// ==================== 父子组件传值（与 MdEditor 同款模式）====================
const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: string
    // 编辑器高度，支持任何合法 CSS 高度值（px / % / vh 等），默认 400px
    height?: string
  }>(),
  {
    language: 'javascript',
    height: '400px',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 编辑器容器 DOM 的引用，onMounted 后才有值
const editorContainer = ref<HTMLDivElement>()

// 编辑器实例：非响应式！普通变量即可（响应式代理反而会破坏 Monaco 内部机制）
let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return
  /**
   * monaco.editor.create(容器, options)
   * 必须在 onMounted 里调用——此时 DOM 才渲染完成，且容器必须有宽高
   */
  editorInstance = monaco.editor.create(editorContainer.value, {
    value: props.modelValue, // 初始内容
    language: props.language, // 语法高亮语言
    theme: 'vs-dark', // 主题（vs / vs-dark / hc-black）
    automaticLayout: true, // 容器尺寸变化时自动重算布局（很关键）
    fontSize: 14,
    minimap: {
      enabled: true, // 右侧缩略图（文章专门讲过的那个配置）
      renderCharacters: true, // 缩略图渲染真实字符而非色块
    },
    readOnly: false, // 只读模式
    scrollBeyondLastLine: false, // 禁止滚动超过最后一行
    tabSize: 4,
    // 关键：关闭 Monaco 0.52+ 在 Chrome/Edge 上默认启用的 Native EditContext 输入管线。
    // 该新管线会把焦点放到只读的 ime-text-area 上，而复制/粘贴监听只绑在 native-edit-context 上，
    // 导致复制粘贴、空行删除等按键失效（普通打字不受影响）。
    // 设为 false 回退到传统可编辑 textarea 输入（TextAreaEditContext），按键/剪贴板行为稳定。
    editContext: false,
  })

  /**
   * ==================== 关键修复：删除类 beforeinput 拦截器 ====================
   * 问题：Monaco 0.56 的 TextAreaEditContext（editContext: false 模式）只处理
   *       插入类 beforeinput（insertFromPaste、insertLineBreak），
   *       不处理删除类 beforeinput（deleteContentBackward、deleteContentForward）。
   *       浏览器直接改了 textarea 的值，Monaco 的模型却没同步 → 删除失效。
   *
   * 修复：在 textarea 上加 capture 阶段（比 Monaco 自己的 handler 更早）的 beforeinput 监听器，
   *       遇到删除类 inputType 时阻止浏览器默认行为，改用 Monaco 自己的删除命令更新模型。
   *       只有 Monaco keydown 没拦截住的删除（空行 Backspace、选中删除、剪切）才会走到这里，
   *       单字符 Backspace 会被 Monaco keydown 拦截、不会触发 beforeinput，所以不会重复处理。
   */
  const taEl = editorContainer.value.querySelector('textarea') as HTMLTextAreaElement | null
  if (taEl) {
    taEl.addEventListener(
      'beforeinput',
      (e: Event) => {
        const ie = e as InputEvent
        const inputType = ie.inputType
        // 退格删除（含选中后 Backspace、空行 Backspace）
        if (inputType === 'deleteContentBackward') {
          e.preventDefault()
          editorInstance?.trigger('ta-fix', 'deleteLeft', null)
        }
        // Delete 键删除（含选中后 Delete）
        else if (inputType === 'deleteContentForward') {
          e.preventDefault()
          editorInstance?.trigger('ta-fix', 'deleteRight', null)
        }
        // 剪切导致的删除（Ctrl+X 删选中内容）
        else if (inputType === 'deleteByCut') {
          e.preventDefault()
          editorInstance?.trigger('ta-fix', 'deleteLeft', null)
        }
      },
      true, // capture 阶段，在 Monaco 自己的 handler 之前执行
    )

    // 剪切事件（Ctrl+X）：浏览器先发 cut 事件，再发 beforeinput deleteByCut。
    // 在 cut 阶段把选中文本写入剪贴板，beforeinput 阶段再删模型，两步配合完成剪切。
    taEl.addEventListener(
      'cut',
      (e: ClipboardEvent) => {
        const selection = editorInstance?.getSelection()
        const model = editorInstance?.getModel()
        if (selection && model) {
          const selectedText = model.getValueInRange(selection)
          if (selectedText) {
            // 优先用剪贴板事件 API 写入，失败则用 navigator.clipboard 兜底
            if (e.clipboardData) {
              e.clipboardData.setData('text/plain', selectedText)
            } else {
              navigator.clipboard?.writeText(selectedText).catch(() => {})
            }
          }
        }
        e.preventDefault()
      },
      true, // capture 阶段
    )
  }

  /**
   * onDidChangeModelContent：监听内容变化（文章 API 表中的核心方法）
   * 用户每敲一个字触发一次，getValue() 取最新全文，emit 给父组件
   */
  editorInstance.onDidChangeModelContent(() => {
    if (editorInstance) {
      emit('update:modelValue', editorInstance.getValue())
    }
  })
})

/**
 * 父组件改了 modelValue → 同步回编辑器
 * 加 getValue() !== newVal 判断，防止"自己 emit 的值又设回自己"造成死循环
 *
 * 注意：不用 setValue()（它会整体重置模型、清空撤销栈和光标位置），
 * 改用模型上的 applyEdits 做全量替换，保留撤销栈，避免干扰剪贴板等正在进行的操作。
 * flush: 'post' 让回调在 DOM 更新后执行，进一步降低对编辑器键盘操作的干扰。
 */
watch(
  () => props.modelValue,
  (newVal) => {
    const model = editorInstance?.getModel()
    if (model && model.getValue() !== newVal) {
      model.applyEdits([{ range: model.getFullModelRange(), text: newVal }])
    }
  },
  { flush: 'post' },
)

/**
 * 父组件切换语言（比如从 java 切到 cpp）→ 动态切换高亮
 */
watch(
  () => props.language,
  (newLang) => {
    const model = editorInstance?.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLang)
    }
  },
)

/**
 * 组件卸载时销毁编辑器实例，释放内存（防止内存泄漏）
 */
onBeforeUnmount(() => {
  editorInstance?.dispose()
  editorInstance = null
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  /* 高度由 height prop 通过内联 style 控制（默认 400px） */
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  overflow: hidden;
}
</style>
