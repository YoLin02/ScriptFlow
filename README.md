# Visual Text Flow

Visual Text Flow 是一个面向写作、脚本策划、内容拆解和非线性结构梳理的可视化文本工作台。它将左侧的长文本富文本编辑器与右侧的节点画布结合在一起，支持把正文段落拆分成卡片，并通过连线、标签、图片、表格和时间轴来组织内容关系。

项目为纯前端静态应用，构建后可直接部署到 Nginx、GitHub Pages、Vercel、Netlify、Cloudflare Pages、对象存储或任意静态资源服务器中，不依赖后端服务。

## 主要功能

- 长文本编辑：基于 Tiptap 的富文本编辑器，支持标题、列表、引用、加粗、斜体等基础写作能力。
- 段落切片：可将主文档中的选中文本或段落快速转化为画布节点。
- 可视化画布：基于 React Flow 构建节点关系图，支持拖拽、缩放、连线和节点布局。
- 多类型节点：支持文本节点、图片节点、灵感节点、表格节点、时间轴节点。
- 连线语义：可为节点之间的关系设置标签，例如承接、转折、因果、分支、补充证据等。
- 时间轴关联：时间轴节点支持多个刻度点，可将特定时刻与内容节点建立关联。
- 媒体库：支持批量上传图片、插入图片节点、下载媒体资源。
- 逆向重组：可根据画布中的文本/灵感节点关系，将内容重新组装回主文档。
- 撤销/重做：画布工作区支持撤销和重做操作。
- 自动保存：工作区会自动保存到浏览器本地，并在顶部工具区显示最近保存时间。
- 导入/导出：支持将工作区导出为 JSON，也可重新导入恢复。
- 统一反馈：操作提示和确认操作统一使用 Toast / Modal，不再依赖浏览器原生 alert / confirm。

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Tiptap
- React Flow / `@xyflow/react`
- Lucide React
- IndexedDB / localStorage 本地存储

## 项目结构

```text
visual-text-flow/
  index.html                 # 应用 HTML 入口
  package.json               # 依赖与脚本
  vite.config.ts             # Vite 配置、构建分包、版本注入
  README.md                  # 项目说明文档
  src/
    main.tsx                 # React 应用入口
    App.tsx                  # 应用主布局、工作区状态、自动保存、撤销重做
    appMetadata.ts           # 应用名称和版本元信息
    db.ts                    # IndexedDB / localStorage 存储封装
    presets.ts               # 内置预设工作区
    types.ts                 # 全局类型、节点数据类型、工作区结构
    index.css                # 全局样式与 Tailwind 引入
    components/
      Header.tsx             # 顶部品牌区、菜单、导入导出入口
      TiptapEditor.tsx       # 左侧长文本富文本编辑器
      FlowCanvas.tsx         # 右侧可视化画布主逻辑
      CanvasToolbar.tsx      # 画布顶部工具集合
      WorkspaceHistoryControls.tsx # 撤销/重做按钮
      EdgeRelationshipEditor.tsx   # 连线关系编辑器
      MediaLibraryDrawer.tsx       # 图片媒体库
      AssemblyPreviewModal.tsx     # 逆向重组预览弹窗
      ClearCanvasConfirmModal.tsx  # 清空画布确认弹窗
      CanvasHintBubble.tsx         # 画布操作提示
      flowCanvasUtils.ts           # 画布关系、组装、筛选等工具函数
      feedback/
        FeedbackProvider.tsx       # Toast / Modal 统一反馈系统
      nodes/
        TextNode.tsx               # 文本节点
        ImageNode.tsx              # 图片节点
        IdeaNode.tsx               # 灵感节点
        TableNode.tsx              # 表格节点
        TimelineNode.tsx           # 时间轴节点
        StandardHandles.tsx        # 节点连接点
        NodeActionContext.tsx      # 节点操作上下文
```

## 数据结构说明

画布中的节点统一使用区分型联合类型进行描述，不同节点根据 `type` 区分具体数据结构。

- `text`：普通文本卡片。
- `image`：图片资源卡片，包含图片地址和说明。
- `idea`：灵感/批注卡片。
- `table`：结构化表格节点，表格数据保存在 `tableData` 中。
- `timeline`：时间轴轨道节点，刻度数据保存在 `timelineData` 中。

表格和时间轴已从旧的 JSON 字符串存储方式迁移为结构化字段。为了兼容旧数据，应用仍会尝试读取历史保存在 `content` 中的 JSON 字符串，但新的保存结果会优先使用 `tableData` 和 `timelineData`。

## 本地启动

### 环境要求

- Node.js 18 或更高版本
- npm

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

## 构建与预览

### 类型检查

```bash
npm run lint
```

当前项目的 `lint` 脚本执行的是 TypeScript 类型检查：

```bash
tsc --noEmit
```

### 生产构建

```bash
npm run build
```

构建产物会生成在：

```text
dist/
```

### 本地预览生产产物

```bash
npm run preview
```

## 静态部署

项目构建后只需要部署 `dist/` 目录即可，无需 Node.js 后端运行时。

常见部署方式：

- Nginx / Apache 静态站点
- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- 对象存储 + CDN
- 宝塔面板静态网站

如果部署平台启用了前端路由，需要将所有未知路径回退到 `index.html`。当前项目暂未使用前端路由，因此普通静态托管即可运行。

## 版本显示

顶部版本号由 Vite 构建时注入：

- 在 GitHub Actions 以 tag 方式构建时，优先读取 `GITHUB_REF_NAME`。
- 本地构建时，回退读取 `package.json` 中的 `version`。

例如 GitHub tag 为 `v1.2.0` 时，页面顶部会显示 `v1.2.0`。

## 本地数据保存

应用会将以下内容保存在浏览器本地：

- 主文档 HTML
- 画布节点与连线
- 图片媒体库资源
- 自定义连线标签
- 最近工作区状态

需要注意：

- 数据不会自动同步到服务器。
- 换设备或换浏览器后不会自动出现原工作区。
- 清除浏览器数据可能会导致本地工作区丢失。
- 建议重要内容定期使用“导出工作区备份”生成 JSON 文件。

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器
npm run lint     # TypeScript 类型检查
npm run build    # 生产构建
npm run preview  # 本地预览构建产物
```

## 项目定位

Visual Text Flow 适合用于：

- 长文写作结构整理
- 小说、剧本、短视频脚本规划
- 文章段落拆解与重组
- 复杂内容关系图谱梳理
- 创意笔记和灵感卡片管理
- 时间线内容规划

它不是在线协作系统，也不是后端内容管理系统。当前版本更适合作为一个轻量、离线优先、可部署为静态站点的个人写作与内容结构化工具。
