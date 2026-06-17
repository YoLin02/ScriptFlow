# ScriptFlow

面向编导、写作者和内容策划的可视化脚本 / 文本结构化画布工具。

在线体验：https://flow.yolin02.top/
当前状态：Production Beta / 单人本地版

<img width="2152" height="1383" alt="image" src="https://github.com/user-attachments/assets/f3ee50ec-0678-49cf-9fdd-93943eb9e3a6" />


## 功能特性

- 富文本写作：基于 Tiptap，支持标题、列表、引用、加粗、斜体等基础编辑能力。
- 段落切片：可将选区或段落快速生成画布节点。
- 可视化画布：支持节点拖拽、缩放、框选、多选、连线、复制粘贴、对齐和分布。
- 多类型节点：支持文本、图片、灵感、表格、时间轴等节点类型。
- 节点模板：可将框选区域保存为模板，并在画布中再次插入。
- 媒体库：支持图片上传、插入图片节点和资源管理。
- Markdown：支持 Markdown 导入与导出。
- 查找替换：支持正文查找、替换、全部替换和结果跳转。
- 本地保存：使用浏览器本地存储保存工作区状态。
- 静态部署：构建后可部署到任意静态资源服务。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Tiptap
- React Flow / `@xyflow/react`
- Lucide React
- IndexedDB

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 启动开发服务

```bash
npm run dev
```

默认开发地址：

```text
http://localhost:3000
```

## 常用脚本

```bash
npm run dev      # 启动开发服务器
npm run lint     # TypeScript 类型检查
npm run build    # 生产构建
npm run preview  # 预览生产构建结果
```

## 项目结构

```text
src/
  app/                  # 应用入口布局与工作区状态
  features/
    canvas/             # 画布、节点、连线、模板、媒体库等能力
    script-editor/      # Tiptap 编辑器、目录、查找替换、Markdown 导入导出
    shortcuts/          # 快捷键配置与设置面板
    collaboration/      # 协作能力预留目录
  shared/
    feedback/           # Toast / Modal 统一反馈
    storage/            # IndexedDB 存储封装
  main.tsx              # React 入口
  types.ts              # 全局类型定义
  index.css             # 全局样式
```

## 构建部署

执行生产构建：

```bash
npm run build
```

构建产物位于：

```text
dist/
```

该项目是纯前端静态应用，部署时只需要发布 `dist/` 目录即可。可部署到 Nginx、GitHub Pages、Vercel、Netlify、Cloudflare Pages、对象存储或其他静态资源服务器。

## 本地数据

ScriptFlow 默认将工作区数据保存在当前浏览器中，包括正文内容、画布节点、连线、媒体资源和模板数据。

请注意：

- 数据不会自动同步到云端。
- 更换浏览器或设备后不会自动迁移。
- 清除浏览器数据可能导致本地工作区丢失。
- 重要内容建议定期导出备份。

## 开发说明

- React Flow 相关开发请参考 `AGENTS.md` 中的 React Flow 文档要求。
- 当前项目不包含账号、登录、多人协作或云端同步。
- 修改后建议至少执行 `npm run lint` 和 `npm run build`。

## License

当前仓库未声明开源许可证。如需公开发布，请先补充 LICENSE 文件。
