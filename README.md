# Visual Text Flow

Visual Text Flow is a non-linear writing workspace that combines a long-form rich text editor with a visual canvas. It is designed for outlining, story planning, script structuring, and mapping relationships between text fragments, ideas, images, tables, and timeline tracks.

## Features

- Rich text editing with Tiptap
- Text slicing from the main document into canvas cards
- Visual node graph powered by React Flow
- Multiple node types: text, image, idea, table, timeline
- Relationship labeling between nodes
- Automatic local persistence with IndexedDB fallback
- Workspace import/export with JSON backups
- Preset templates for fast onboarding

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Tiptap
- React Flow (`@xyflow/react`)
- Lucide React

## Project Structure

```text
src/
  App.tsx                   # App-level state and responsive layout
  db.ts                     # IndexedDB/localStorage persistence helpers
  presets.ts                # Built-in workspace presets
  types.ts                  # Shared node and workspace types
  components/
    Header.tsx              # Top toolbar and workspace actions
    TiptapEditor.tsx        # Left-side rich text editor
    FlowCanvas.tsx          # Right-side visual canvas
    CustomNodes.tsx         # Custom node renderers and editors
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The app runs by default on [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Data Persistence

Workspace content is saved locally in the browser. The app stores:

- Main document HTML
- Canvas nodes and edges
- Uploaded media assets
- Custom edge relation tags

## Notes

- This project currently works as a frontend-only local application.
- No external AI service or backend runtime is required in the current implementation.
