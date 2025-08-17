
Tech Stack
This document defines the technology stack and high-level architecture for the AI-driven Figma → Angular Converter Tool, including runtime sequence diagrams to show interaction flows.

1. Frontend (Angular Application Generator)
* Framework: Angular 17+
* Language: TypeScript
* State Management: RxJS
* UI Components: Angular Material + custom SCSS
* Testing:
    * Unit Tests → Jest (preferred) or Karma/Jasmine
    * End-to-End (E2E) Tests → Cypress

2. AI Integration Layer
* Runtime: Node.js (LTS) with TypeScript
* AI Orchestration: LangChain.js or LlamaIndex.js
* LLM Models:
    * OpenAI GPT models (cloud) OR
    * Ollama (local inference)
* Protocol: Model Context Protocol (MCP) for structured AI ↔ Figma communication

3. Figma Integration
* API: Figma REST API
* Realtime Updates: Figma Webhooks
* MCP Server: Custom MCP wrapper for Figma API handling

4. Code Comparison & Refactoring Engine
* AST Parsing: ts-morph (TypeScript/Angular AST analysis)
* Code Diffing: diff-match-patch (efficient code comparison)
* Linting & Formatting:
    * ESLint
    * Prettier

5. Backend (Optional – For Collaboration & Persistence)
* Framework: NestJS (Node.js + TypeScript)
* Database: PostgreSQL with Prisma ORM
* Caching: Redis (for AI cache & Figma sync state)

6. DevOps & Infrastructure
* Containerization: Docker
* Orchestration: Kubernetes or AWS ECS (production scaling)
* CI/CD: GitHub Actions
* Workspace Management: Nx Monorepo (for Angular + Node)

7. Documentation & Runtime Context Management
* Requirements Tracking: requirement.md
* Execution Progress Tracking: progress.md (auto-updated at runtime)
* API Docs: typedoc for TypeScript

8. High-Level Architecture

flowchart TD

  subgraph Figma["🎨 Figma Platform"]
    API["Figma REST API"]
    Webhooks["Figma Webhooks"]
  end

  subgraph MCP["⚡ MCP Server (Figma Wrapper)"]
    MCPHandler["Figma API Handler"]
  end

  subgraph AI["🤖 AI Integration Layer"]
    LangChain["LangChain.js / LlamaIndex.js"]
    LLM["LLM (OpenAI / Ollama)"]
    AST["AST Parser (ts-morph)"]
    Diff["Code Diff Engine"]
  end

  subgraph Frontend["💻 Angular Code Generator"]
    Angular["Angular 17+"]
    RxJS["RxJS + Material UI"]
  end

  subgraph Backend["🗄 Optional Backend (Collaboration)"]
    NestJS["NestJS (Node + TS)"]
    DB["PostgreSQL + Prisma"]
    Redis["Redis Cache"]
  end

  subgraph Infra["☁ DevOps & Infra"]
    Docker["Docker"]
    CI["GitHub Actions"]
    K8s["Kubernetes / ECS"]
  end

  Figma -->|Design Fetch| MCPHandler
  MCPHandler -->|Structured Data| LangChain
  LangChain --> LLM
  LLM --> AST
  AST --> Diff
  Diff --> Angular
  Angular -->|Generated Code| Frontend
  Angular -->|UI Testing| Frontend
  Backend --> LangChain
  DB --> Backend
  Redis --> Backend
  CI --> Docker
  Docker --> K8s

9. Runtime Flows (Sequence Diagrams)
9.1 Figma → Angular Code Generation

sequenceDiagram
    participant Dev as Developer
    participant Figma as Figma API
    participant MCP as MCP Server
    participant AI as AI Layer (LangChain+LLM)
    participant AST as AST Parser & Diff
    participant NG as Angular Generator

    Dev->>Figma: Request design export
    Figma-->>MCP: JSON design data
    MCP->>AI: Forward structured design
    AI->>AST: Analyze + Map to Angular Components
    AST->>NG: Generate Angular TS/HTML/CSS
    NG-->>Dev: Deliver Angular codebase

9.2 Code Comparison & Refactoring (Developer Flow)

sequenceDiagram
    participant Dev as Developer
    participant Repo as Existing Angular Code
    participant AI as AI Layer
    participant AST as AST Parser & Diff
    participant Formatter as Prettier/ESLint

    Dev->>Repo: Provides existing components
    Repo-->>AI: Code snapshot
    AI->>AST: Compare design vs code
    AST->>AI: Differences + Suggestions
    AI->>Formatter: Apply refactoring rules
    Formatter-->>Dev: Updated, formatted code
