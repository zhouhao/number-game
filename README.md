# 数数小乐园 🍎🚗

给小朋友（4 岁起）练习加减法的网页小游戏。用水果、车辆、小动物等实物图案出题，支持中英文读题，电脑和平板都能用。

线上地址：https://number-game.hzhou.workers.dev

## 功能

- **难度**：5 以内加法 → 10 以内加法 → 10 以内减法 → 10 以内加减法 → 20 以内加减法
- **实物出题**：加法是两堆物品并排，减法是被拿走的物品打 ✖
- **答题方式**：选一选（4 个选项）或写一写（输入数字）
- **读题语音**：自动朗读题目，可选中文或英文，🔊 按钮可重听
  - 英文：服务器用 Workers AI 的 Deepgram Aura-2 生成自然语音，结果缓存在 KV；失败时退回设备语音
  - 中文：设备自带语音，自动优先选高级/增强声音（iPad 可在 设置 → 辅助功能 → 朗读内容 → 声音 中下载）
- **答错不给答案**：提示"再想想哦"，可以重答；只有第一次就答对才计分
- **评分**：每局 5/10/15/20 题，结束给 0–100 分和 1–3 颗星
- **账号**：邮箱密码注册登录，成绩按账号保存；一个账号下可用不同名字区分多个孩子
- **接水管小游戏**（`/pipes.html`）：把 6 个水管方块拖进 3×3 网格，点一下顺时针转 90°，每块只能用一次；接通 🐰 到 🍄 就过关。关卡随机生成且保证有解

## 技术结构

纯静态前端 + 一个 Cloudflare Worker，无构建步骤、无依赖。

| 路径 | 说明 |
|---|---|
| `public/index.html` | 页面与交互 |
| `public/game.js` | 出题、选项、读题文本、挑选设备语音（纯逻辑）；加难度在 `LEVELS` 里加一行 |
| `public/pipes.html` | 接水管小游戏页面与拖拽交互 |
| `public/pipes.js` | 接水管：水流判断、随机生成有解关卡（纯逻辑） |
| `src/worker.js` | API：`/api/register` `/api/login` `/api/logout` `/api/me` `/api/scores` `/api/tts`（英文语音，需登录） |
| `src/auth.js` | PBKDF2 密码哈希、会话 Cookie |
| `schema.sql` | D1 表结构：`users` `sessions` `scores` |
| `wrangler.jsonc` | Worker 配置：静态资源、D1、Workers AI、KV（语音缓存）、登录限流（每 IP 每分钟 10 次） |

## 本地开发

需要 Node 和 [Wrangler](https://developers.cloudflare.com/workers/wrangler/)。

```bash
npm run db:local   # 初始化本地 D1 数据库（首次）
npm run dev        # http://localhost:8787
npm run dev:lan    # 同一 Wi-Fi 下的平板访问 http://<电脑IP>:8787
npm test           # 出题逻辑和接水管自测
```

## 部署

```bash
wrangler d1 execute number-game --remote --file schema.sql   # 仅首次或表结构变更时
npm run deploy
```

## 已知限制

- 接水管游戏还没有从主页进入的入口，需直接打开 `/pipes.html`
- 没有找回/修改密码功能
- "写一写"模式答不对会一直停在当前题
- 中文读题音质取决于设备自带的语音；iPad 需关闭静音
- 本地开发时 Workers AI 也走线上，生成英文语音会产生（极少的）费用
