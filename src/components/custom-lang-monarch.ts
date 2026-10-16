/**
 * 自定义语言定义（Monarch 格式）
 * 参考自 https://microsoft.github.io/monaco-editor/monarch.html
 *
 * Monarch 是 Monaco 内置的词法分析器 DSL：
 * tokenizer 里的每条规则 = [正则, 生成什么 token]
 * 编辑器拿到 token 类型（keyword / string / number...）后自动上色
 */
import type * as monaco from 'monaco-editor'

const customLangMonarch: monaco.languages.IMonarchLanguage = {
  // 关键字：命中后归为 keyword 组（tokenizer 里通过 @keywords 引用）
  keywords: [
    'abstract', 'continue', 'for', 'new', 'switch', 'assert', 'goto', 'do', 'if', 'private',
    'this', 'break', 'protected', 'throw', 'else', 'public', 'enum', 'return', 'catch', 'try',
    'interface', 'static', 'class', 'finally', 'const', 'super', 'while', 'true', 'false',
  ],

  // 类型关键字：单独一组，同样归为 keyword 上色
  typeKeywords: ['boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float'],

  // 运算符
  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-',
    '*', '/', '&', '|', '^', '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],

  // 符号（上面 operators 的字符集，用于"非运算符的尖括号"判断）
  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  // 转义字符（如 \n \u1234）
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // 主要的标记器：从 root 状态开始逐字符匹配
  tokenizer: {
    root: [
      // 标识符和关键字：先匹配单词，再按 cases 查表归类
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            '@typeKeywords': 'keyword', // 命中 typeKeywords 列表 → keyword
            '@keywords': 'keyword',     // 命中 keywords 列表 → keyword
            '@default': 'identifier',  // 都没命中 → 普通标识符
          },
        },
      ],
      [/[A-Z][\w\$]*/, 'type.identifier'], // 大写开头的单词 → 类型标识符（美观显示类名）

      // 空白字符：跳转到 @whitespace 子状态处理
      { include: '@whitespace' },

      // 分隔符和运算符
      [/[{}()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator', // 命中 operators 列表 → operator
            '@default': '',
          },
        },
      ],

      // @ 注解（如 @Override）
      [/@\s*[a-zA-Z_\$][\w\$]*/, { token: 'annotation', log: 'annotation token: $0' }],

      // 数字：浮点、十六进制、整数（顺序有讲究）
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // 分隔符：放在数字后面是因为 .\d 会被误认为浮点数
      [/[;,.]/, 'delimiter'],

      // 字符串：" 开头 → 跳转到 @string 子状态
      [/"([^"\\]|\\.)*$/, 'string.invalid'], // 未终止的字符串
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

      // 字符（单引号）
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
      [/'/, 'string.invalid'],
    ],

    // 注释子状态：支持嵌套注释（/* /* */ */）
    comment: [
      [/[^\/*]+/, 'comment'],
      [/\/\*/, 'comment', '@push'], // 嵌套注释：压栈
      ['\\*/', 'comment', '@pop'],  // 注释结束：出栈
      [/[\/*]/, 'comment'],
    ],

    // 字符串子状态
    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }], // 闭合引号：回到 root
    ],

    // 空白子状态：处理空格、tab、换行和两种注释
    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/, 'comment', '@comment'], // /* ... */ 跳到 comment 子状态
      [/\/\/.*$/, 'comment'],           // 单行注释
    ],
  },
}

export default customLangMonarch
