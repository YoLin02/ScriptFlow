/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarkerType } from '@xyflow/react';
import { WorkspaceSaveState } from './types';

// Preset 1: Quantum Non-Linear Chrono Narrative
export const quantumStoryPreset: WorkspaceSaveState = {
  mainDocumentHtml: `<h1>量子纠缠时空分枝网络</h1>
<p>在传统的线性叙事中，读者只能沿着唯一的道路旅行。但有了拓扑非线性布局，逻辑线索可以向多个结局和维度跃迁，实现交互小说或高维推演书写。</p>
<h2>节点01：2052 废弃光子芯片</h2>
<p>科学家林诺在2052年废弃的高能正负电子对撞机底层深潜时，意外发掘了一颗完好的光子芯片，上面刻有：【未来的警告】。</p>
<h2>节点02：自发引力坍缩</h2>
<p>数据表明，由于引力常数的突变，对撞机实验在该引力坍缩周期发生了错位。这在时间线上产生了一个封闭的回溯环，将未来的信息投影在过去。</p>
<h2>节点03：林诺的决择方案</h2>
<p>林诺在发现真相后，有两个选择：在芯片中输入纠错密钥（触发分支结局 A）；或利用该芯片作为信标逆向广播（触发分支结局 B）。</p>
<h2>节点04：观察者坍缩效应</h2>
<p>只有当外部观察者建立阅读连线链接时，引力封闭通道才完成信息回授，形成稳定的拓扑时空闭环。</p>`,
  
  nodes: [
    {
      id: "node-q1",
      type: "text",
      position: { x: 50, y: 100 },
      data: {
        id: "node-q1",
        type: "text",
        title: "01. 2052深潜发现",
        content: "科学家林诺在2052年废弃的高能正负电子对撞机底层深潜时，意外发掘了一颗完好的光子芯片，上面刻有：【未来的警告】。",
        createdAt: Date.now()
      }
    },
    {
      id: "node-q2",
      type: "text",
      position: { x: 420, y: 50 },
      data: {
        id: "node-q2",
        type: "text",
        title: "02. 纠缠自发引力坍缩",
        content: "数据表明，由于引力常数的突变，对撞机实验在该引力坍缩周期发生了错位。这在时间线上产生了一个封闭的回溯环。",
        createdAt: Date.now() + 1000
      }
    },
    {
      id: "node-q3",
      type: "text",
      position: { x: 790, y: 120 },
      data: {
        id: "node-q3",
        type: "text",
        title: "03. 林诺决择分支",
        content: "林诺有两个选择：在芯片中输入纠错密钥（启动逻辑 A）；或利用该芯片作为信标逆向广播（启动逻辑 B）。",
        createdAt: Date.now() + 2000
      }
    },
    {
      id: "node-q4",
      type: "image",
      position: { x: 420, y: 350 },
      data: {
        id: "node-q4",
        type: "image",
        title: "量子共振插图",
        content: "",
        imageUrl: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=600&q=80",
        imageCaption: "概念图示：封闭类时曲线在量子微观环境下的纠缠行为",
        createdAt: Date.now() + 3000
      }
    },
    {
      id: "node-q5",
      type: "idea",
      position: { x: 80, y: 440 },
      data: {
        id: "node-q5",
        type: "idea",
        title: "写作灵感：增加一个第三结局",
        content: "如果林诺其实根本没有肉身接触过芯片，而是这颗存储芯片中运行的一段AI虚拟意识？",
        createdAt: Date.now() + 4000
      }
    }
  ],
  
  edges: [
    {
      id: "e-q1-q2",
      source: "node-q1",
      target: "node-q2",
      label: "因果/推导",
      animated: true,
      style: { stroke: "#171717", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#171717"
      }
    },
    {
      id: "e-q2-q3",
      source: "node-q2",
      target: "node-q3",
      label: "分支/并行",
      animated: true,
      style: { stroke: "#2563eb", strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#2563eb"
      }
    },
    {
      id: "e-q2-q4",
      source: "node-q2",
      target: "node-q4",
      label: "补充证据",
      animated: false,
      style: { stroke: "#16a34a", strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#16a34a"
      }
    },
    {
      id: "e-q5-q1",
      source: "node-q5",
      target: "node-q1",
      label: "批注备注",
      animated: false,
      style: { stroke: "#a3a3a3", strokeWidth: 1.2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#a3a3a3"
      }
    }
  ]
};

// Preset 2: Brainstorm Product Logic map
export const brainstormPreset: WorkspaceSaveState = {
  mainDocumentHtml: `<h1>视觉非线性卡片编辑软件</h1>
<p>我们致力于探索高阶人机交互界面，使得用户能够同时享受线性的优雅文稿排版和无界画布的敏捷脑图组织。</p>
<h2>第1层：左侧独立富文本编辑器</h2>
<p>提供 Tiptap 专业底层的富文本支撑。支持段落切片管理器，监控文稿的每一截呼吸，支持选取特定文字快速生成卡片。</p>
<h2>第2层：无限 React Flow 画布</h2>
<p>提供自由拖拽定位和4向智能连线。包含卡片定制机制，可以就地双击编辑、一锤定音，并加入图像资源加载功能。</p>
<h2>第3层：逆向融合拓扑引擎</h2>
<p>一键拓扑算法，检索连接线中的来龙去脉与闭环，自动将其按逻辑链重塑、合并为新主文档。</p>`,
  
  nodes: [
    {
      id: "node-b1",
      type: "text",
      position: { x: 80, y: 80 },
      data: {
        id: "node-b1",
        type: "text",
        title: "左侧 Tiptap 富文本区",
        content: "提供 Tiptap 专业底层的富文本支撑。支持段落切片管理器，监控文稿的每一截呼吸，支持选取特定文字快速生成卡片。",
        createdAt: Date.now()
      }
    },
    {
      id: "node-b2",
      type: "text",
      position: { x: 440, y: 80 },
      data: {
        id: "node-b2",
        type: "text",
        title: "右侧 React Flow 画布区",
        content: "提供自由拖拽定位和4向智能连线。包含卡片定制机制，可以就地双击编辑、一锤定音，并加入图像资源加载功能。",
        createdAt: Date.now() + 1000
      }
    },
    {
      id: "node-b3",
      type: "text",
      position: { x: 800, y: 150 },
      data: {
        id: "node-b3",
        type: "text",
        title: "逆向合并核心引擎",
        content: "一键拓扑算法，检索连接线中的来龙去脉与闭环，自动将其按逻辑链重塑、合并为新主文档，同步写入左侧。",
        createdAt: Date.now() + 2000
      }
    },
    {
      id: "node-b4",
      type: "image",
      position: { x: 440, y: 340 },
      data: {
        id: "node-b4",
        type: "image",
        title: "技术栈架构图",
        content: "",
        imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
        imageCaption: "白色极简风格的 UI 配色与产品架构设计",
        createdAt: Date.now() + 3000
      }
    },
    {
      id: "node-b5",
      type: "idea",
      position: { x: 800, y: 440 },
      data: {
        id: "node-b5",
        type: "idea",
        title: "未来计划：服务端同步",
        content: "可增加云端协作、协同指针、多客户端同时连连看创作等好玩的功能。",
        createdAt: Date.now() + 4000
      }
    }
  ],
  
  edges: [
    {
      id: "e-b1-b2",
      source: "node-b1",
      target: "node-b2",
      label: "承接",
      animated: true,
      style: { stroke: "#737373", strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#737373"
      }
    },
    {
      id: "e-b2-b3",
      source: "node-b2",
      target: "node-b3",
      label: "因果/推导",
      animated: true,
      style: { stroke: "#171717", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#171717"
      }
    }
  ]
};

// Preset 3: Blank Canvas setup
export const blankPreset: WorkspaceSaveState = {
  mainDocumentHtml: `<h1>开始无界灵性创作吧...</h1><p>在这里清空一切杂音。你可以先在此处书写一些你的初稿，然后随时进行段落提取切片，放飞你的写作架构！</p>`,
  nodes: [],
  edges: []
};
