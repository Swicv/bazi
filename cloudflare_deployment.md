# 灵境玄机阁 · Cloudflare 部署完整实战指南

本项目采用纯原生 JavaScript 架构（**零第三方二进制依赖**，排盘和天文算法均由纯 JS 驱动），因此**天然极其适合部署在 Cloudflare**！

以下推荐两种最主流的 Cloudflare 部署方案：

---

## 方案一：Cloudflare Tunnel（云洞穿透，最推荐、零代码改造、2分钟上线）

如果你的后端服务运行在自己的服务器（如腾讯云、阿里云、海外 VPS 或本地 Linux 主机），使用 Cloudflare 官方免费的 **Cloudflare Tunnel** 是最稳定、最省事的商业级方案。

### 核心优势：
- 不需要开放服务器端口，不怕源站 IP 泄露被黑客攻击。
- Cloudflare 自动提供全球免费 CDN 加速、防 DDoS 高防盾牌与自动化 HTTPS 证书。
- 绑定你自己的域名（例如 `bazi.yourdomain.com`）。

### 部署步骤：
1. **安装 cloudflared（官方客户端）**：
   ```bash
   # Ubuntu / Debian
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. **快捷一键临时公网访问（免登录测试）**：
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   终端会立即输出一个类似 `https://xxx-xxx.trycloudflare.com` 的免费公网 HTTPS 地址，手机电脑皆可直接访问！
3. **绑定自己的专属独立域名**：
   - 在 Cloudflare 控制台左侧进入 `Zero Trust` -> `Networks` -> `Tunnels`。
   - 点击 `Create a tunnel`，按提示复制一行命令在服务器执行。
   - 在 Public Hostname 中添加你的二级域名，服务类型选择 `HTTP`，URL 填 `localhost:3000` 即可大功告成！

---

## 方案二：Cloudflare Pages + Workers（纯 Serverless 免费全托管）

如果你希望**彻底告别服务器**，完全白嫖 Cloudflare 的免费全球边缘节点：

### 架构映射：
1. **前端静态资源**：直接托管在 **Cloudflare Pages**（全球免费 CDN）。
2. **后端算法与接口**：
   - 算法模块（`calendar.js`, `bazi.js`, `analyzer.js`）均为纯 JS 代码，直接运行在 Cloudflare Workers V8 运行时中。
   - 卡密数据库：由于 Cloudflare Worker 运行在无盘边缘环境，将 `data/license_keys.json` 挂载到 **Cloudflare KV**（免费提供每天 100,000 次读取）或 **Cloudflare D1**（免费 SQL 数据库）。
   - AI 大模型：可直接调用 **Cloudflare Workers AI**（免费运行 Llama / Qwen 等大模型），或者直接通过 `fetch` 调用 DeepSeek / OpenAI API。

### 一键部署命令：
```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 部署前端静态站点至 Cloudflare Pages
npx wrangler pages deploy public --project-name lingjing-faka
```

---

## 环境变量配置建议（Cloudflare 控制台 Settings -> Environment Variables）

| 变量名 | 默认值 | 作用说明 |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | `admin888` | 管理后台登录密码，务必在生产环境修改为强密码！ |
| `OPENAI_API_KEY` | *(可选)* | 如需接入外部 DeepSeek / OpenAI 大模型，填入对应 Key |
| `OPENAI_API_BASE` | *(可选)* | 大模型接口地址（如 `https://api.deepseek.com/v1`） |
