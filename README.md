# mini-react

用于 **学习与调试 React 核心思路** 的精简实现（教学向），并非可用的 React 替代品。

## 这个仓库在做什么

- 用少量代码走通 **JSX → 虚拟节点（VNode）→ Fiber 链表 reconcile → 提交到真实 DOM** 的流程。
- 支持 **`createElement` / `Fragment`、函数组件、同步 `useState`、DOM 属性与简单事件** 等子集能力。
- 目录命名贴近官方 monorepo 习惯，便于对照真实源码：

  | 路径 | 含义 |
  |------|------|
  | `packages/react/` | 对标 `react`：JSX 运行时、`createElement`、`useState` 等 |
  | `packages/react-dom/` | 对标 `react-dom`：`createRoot`（`react-dom/client`）、legacy `render` |

应用示例在 `src/main.tsx`，通过 Vite 与路径别名以 **`import … from 'react'`**、**`import … from 'react-dom/client'`** 的方式编写，用法接近日常 React 项目。

## 技术栈

- TypeScript、Vite 5

## 本地运行

```bash
npm install
npm run dev
```

构建生产包：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 与真实 React 的差异（心里有数即可）

- 调度为 **同步整树 flush**，无并发特性与优先级调度。
- 未实现 **Concurrent Mode、Suspense、错误边界、完整批量更新、useEffect、列表 diff 的 key 策略** 等。
- 实现集中在 `packages/react/src/core.ts`，便于阅读；官方仓库则会拆到 reconciler、scheduler、宿主配置等多包中。

## 许可

仓库为私有学习用途时可自行约定；若需开源请按需补充 `LICENSE`。
