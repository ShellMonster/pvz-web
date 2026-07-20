# 植物大战僵尸 · Web（pvz-web）

横屏塔防 Web 游戏（React + Phaser + Zustand）。无登录，进度存 `localStorage`。

## 要求

- Node.js ≥ 20.19（推荐 22）
- pnpm 10.10+

## 安装与运行

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm test         # Vitest
pnpm build        # 生产构建
pnpm preview      # 预览构建
```

## 操作

- 首页 → 选关 →（自由选卡关）选卡 → 战斗
- 点卡片选植物，点草地格子种植
- 点金色阳光收集；暂停 / 倍速在战斗顶栏与设置页
- 僵尸破左线触发小推车（若有）；无车则失败

## 路径别名

`@/*` → `src/*`

## 生图（可选）

```bash
export IMAGE_API_BASE=http://localhost:8317/v1
export IMAGE_API_KEY=...
export IMAGE_MODEL=gpt-image-2
node scripts/gen-assets.mjs all
```

生成透明底 PNG 到 `public/assets/plants|zombies`。缺图时战斗用色块占位。

## 架构摘要

- React：路由、选卡、图鉴、设置、战斗 HUD
- `BattleEngine`：网格/阳光/波次/战斗纯逻辑（单测覆盖）
- Phaser：草地渲染与点击输入
- 配置：`src/data/plants|zombies|levels.ts`

详见 [PLAN.md](./PLAN.md)。
