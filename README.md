# 植物大战僵尸 · Web（pvz-web）

横屏塔防 Web 游戏。技术栈：React + Vite + TypeScript + Tailwind + Vitest（后续 Phaser）。

## 要求

- Node.js **≥ 20.19**（推荐 22 LTS）
- **pnpm 10.10+**（见 `packageManager` 字段）

## 安装与运行

```bash
pnpm install
pnpm dev          # 开发 http://localhost:5173
pnpm test         # 单元测试（Vitest）
pnpm build        # 生产构建
pnpm preview      # 预览构建产物
```

## 路径别名

`@/*` → `src/*`（Vite + TypeScript 已配置）

## 开发流程

见根目录 [PLAN.md](./PLAN.md)：PR + TDD，合并前并行子 Agent 审查。

## 环境变量（生图，后续 PR）

复制 `.env.example` 为 `.env.local`（勿提交密钥）。

## 许可

个人学习项目。原创命名与美术；玩法致敬经典塔防。
