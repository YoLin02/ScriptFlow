# AGENTS.md

## React Flow development rules

This project uses React Flow / @xyflow/react to build a canvas-based editor.

Before implementing, refactoring, or debugging any React Flow feature, you must consult the official React Flow LLM documentation first:

- Start with: https://reactflow.dev/llms.txt
- For normal development tasks, use: https://reactflow.dev/llms-medium.txt
- For complex API, examples, layouting, custom nodes, custom edges, whiteboard, performance, or migration issues, use: https://reactflow.dev/llms-full.txt

Do not rely only on memory for React Flow APIs. Prefer the current official documentation.

When working with React Flow:

- Use `@xyflow/react`, not old `react-flow-renderer`.
- Import React Flow styles correctly: `@xyflow/react/dist/style.css`.
- Make sure the ReactFlow parent container has explicit width and height.
- For nodes, edges, handles, custom nodes, custom edges, viewport, selection, drag/drop, grouping, whiteboard features, or performance optimization, first identify the relevant section from the React Flow LLM docs.
- Before writing code, briefly summarize which React Flow docs section or API you are using.
- After changing code, run the project’s lint/typecheck/build command if available.
- Avoid large rewrites unless necessary. Prefer small, testable changes.