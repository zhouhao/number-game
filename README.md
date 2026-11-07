# 数数小乐园 🍎🚗

给小朋友（4 岁起）练习加减法的网页小游戏。用水果、车辆、小动物等实物图案出题，支持中英文读题，电脑和平板都能用。

线上地址：https://number-game.hzhou.workers.dev

## 功能

- **难度**：5 以内加法 → 10 以内加法 → 10 以内减法 → 10 以内加减法 → 20 以内加减法
- **实物出题**：加法是两堆物品并排，减法是被拿走的物品打 ✖
- **答题方式**：选一选（4 个选项）或写一写（输入数字）
- **读题语音**：自动朗读题目，可选中文或英文，🔊 按钮可重听
- **答错不给答案**：提示"再想想哦"，可以重答；只有第一次就答对才计分
- **评分**：每局 5/10/15/20 题，结束给 0–100 分和 1–3 颗星
- **账号**：邮箱密码注册登录，成绩按账号保存；一个账号下可用不同名字区分多个孩子

## 技术结构

纯静态前端 + 一个 Cloudflare Worker，无构建步骤、无依赖。

| 路径 | 说明 |
|---|---|
| `public/index.html` | 页面与交互 |
| `public/game.js` | 出题、选项、读题文本（纯逻辑）；加难度在 `LEVELS` 里加一行 |
| `src/worker.js` | API：`/api/register` `/api/login` `/api/logout` `/api/me` `/api/scores` |
| `src/auth.js` | PBKDF2 密码哈希、会话 Cookie |
| `schema.sql` | D1 表结构：`users` `sessions` `scores` |
| `wrangler.jsonc` | Worker 配置：静态资源、D1 绑定、登录限流（每 IP 每分钟 10 次） |

## 本地开发

需要 Node 和 [Wrangler](https://developers.cloudflare.com/workers/wrangler/)。

```bash
npm run db:local   # 初始化本地 D1 数据库（首次）
npm run dev        # http://localhost:8787
npm run dev:lan    # 同一 Wi-Fi 下的平板访问 http://<电脑IP>:8787
npm test           # 出题逻辑自测
```

## 部署

```bash
wrangler d1 execute number-game --remote --file schema.sql   # 仅首次或表结构变更时
npm run deploy
```

## 已知限制

- 没有找回/修改密码功能
- "写一写"模式答不对会一直停在当前题
- 读题声音取决于设备自带的语音引擎；iPad 需关闭静音
