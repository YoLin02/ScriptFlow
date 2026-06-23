<div align="center">
  <img src="./public/scriptflow-brand-icon.png" width="96" height="96" alt="ScriptFlow Logo" />

  # ScriptFlow

  面向编导、短视频创作者、写作者的可视化脚本工作台。

  把长文本脚本拆成卡片、素材、时间轴和结构关系，在一个画布中完成脚本拆解、编排与重组。

  [在线体验](https://flow.yolin02.top) · [功能特性](#功能特性) · [快速开始](#快速开始) · [部署](#部署) · [License](#license)

  <br />

  ![React](https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-6.x-646cff?style=flat-square&logo=vite&logoColor=white)
  ![React Flow](https://img.shields.io/badge/React%20Flow-12.x-ff0072?style=flat-square)
  ![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square)
</div>

<br />

## 预览

<img width="2152" height="1383" alt="ScriptFlow Preview" src="https://github.com/user-attachments/assets/f3ee50ec-0678-49cf-9fdd-93943eb9e3a6" />

## 简介

ScriptFlow 是一个将「脚本文本」和「可视化结构」结合起来的创作工具。

你可以在左侧编写完整脚本，在右侧把段落拆成卡片，通过连线、图片、表格、时间轴和模板整理创作逻辑。相比纯 Word、Markdown 或 Excel，ScriptFlow 更适合处理脚本中的结构关系、素材引用和非线性编排。

## 适用场景

- 短视频脚本拆解
- 影视解说文案结构整理
- 内容策划和镜头逻辑梳理
- 文案段落切片与重组
- 图片素材与脚本文字对应
- 用可视化画布替代 Excel / Word 做脚本排版

## 功能特性

- **富文本脚本编辑**：基于 Tiptap，支持标题、列表、引用、加粗、斜体等基础编辑能力。
- **段落切片**：可将正文选区或段落快速生成画布节点。
- **可视化画布**：基于 React Flow，支持拖拽、缩放、框选、多选、连线、复制粘贴、对齐和分布。
- **多类型节点**：支持文本、图片、灵感、表格、时间轴等节点类型。
- **节点模板**：可将框选区域保存为模板，并在画布中再次插入。
- **媒体库**：支持图片上传、图片节点插入和素材资源管理。
- **Markdown 导入导出**：支持 Markdown 文件导入与导出。
- **查找替换**：支持正文查找、替换、全部替换和结果跳转。
- **本地优先存储**：使用 IndexedDB 保存工作区状态，无需后端即可运行。
- **静态部署**：构建后可部署到任意静态资源服务。

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 应用框架 | React 19 |
| 开发语言 | TypeScript |
| 构建工具 | Vite |
| 样式 | Tailwind CSS |
| 富文本编辑 | Tiptap |
| 可视化画布 | React Flow / `@xyflow/react` |
| 图标 | Lucide React |
| 本地存储 | IndexedDB |

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

## 部署

执行生产构建：

```bash
npm run build
```

构建产物位于：

```text
dist/
```

ScriptFlow 是纯前端静态应用，部署时只需要发布 `dist/` 目录。可以部署到 Nginx、GitHub Pages、Vercel、Netlify、Cloudflare Pages、对象存储或其他静态资源服务器。

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

本项目基于 Apache License 2.0 开源，详情请查看 [LICENSE](./LICENSE)。
