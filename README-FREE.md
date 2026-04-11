# Obsidian2MP - 完全免费

> 一款完全免费的 Obsidian 插件，将笔记一键推送到微信公众号

[![GitHub stars](https://img.shields.io/github/stars/popomonkey/obsidian2mp?style=flat-square)](https://github.com/popomonkey/obsidian2mp)
[![GitHub license](https://img.shields.io/github/license/popomonkey/obsidian2mp)](https://github.com/popomonkey/obsidian2mp/blob/main/LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-plugin-blue)](https://obsidian.md)

---

## 💖 完全免费

本插件**完全免费**，由开发者用爱发电维护。

如果你觉得这个插件对你有帮助，可以通过以下方式支持：

- ⭐ 在 GitHub 上给个 Star
- 📢 关注公众号：PM智圈|PMAIhub
- 📢 推荐给你身边写公众号的朋友

---

## 功能特性

### 🎨 排版美化
- 3 种预设主题（技术蓝/极客黑/简约灰）
- 代码块语法高亮
- 微信公众号风格排版

### 🤖 AI 辅助
- AI 内容润色（需要 Claude API Key）
- AI 标题生成
- AI 摘要提取
- AI 校对

### 📤 多平台发布
- 微信公众号
- 知乎专栏
- 掘金

### 👁 实时预览
- 所见即所得预览窗口
- 主题实时切换
- 一键复制 HTML

---

## 快速开始

### 方式一：社区插件市场（推荐）

1. 打开 Obsidian 设置
2. 第三方插件 → 浏览
3. 搜索 "Obsidian2MP"
4. 安装并启用

### 方式二：手动安装

1. 从 [Releases](https://github.com/popomonkey/obsidian2mp/releases) 下载最新版本
2. 解压到 `.obsidian/plugins/obsidian2mp/`
3. 重启 Obsidian
4. 在设置中启用插件

### 方式三：开发版

```bash
git clone https://github.com/popomonkey/obsidian2mp.git
cd obsidian2mp
npm install
npm run dev
```

---

## 使用方法

1. 在 Obsidian 中打开任意笔记
2. 点击右侧边栏的 📤 图标
3. 在预览窗口中选择主题
4. 点击"复制 HTML"
5. 粘贴到微信公众号编辑器

### 快捷键

- `Ctrl/Cmd + P` → 输入 "Preview" → 打开预览窗口
- `Ctrl/Cmd + P` → 输入 "Quick Push" → 快速转换复制

---

## 配置说明

### 通用设置

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 默认主题 | 选择排版主题 | 技术蓝 |
| 默认发布平台 | 选择目标平台 | 微信公众号 |
| 预览窗口大小 | 预览窗口高度 | 中 |

### AI 功能配置

需要自行配置 Claude API Key：

1. 访问 https://console.anthropic.com/
2. 创建 API Key
3. 在插件设置中填入

> ⚠️ 注意：AI 功能需要额外付费（按调用量计费）

---

## 主题预览

### 技术蓝
清爽专业的蓝色系，适合技术类文章

### 极客黑
深色极客风，适合代码展示

### 简约灰
简约优雅的灰色系，适合通用场景

---

## 开发者说明

### 为什么免费？

1. **用爱发电** - 本身就是开源爱好者
2. **积累经验** - 练习 TypeScript 和 Obsidian 插件开发
3. **建立影响力** - 认识更多志同道合的朋友
4. **潜在机会** - 说不定有金主爸爸看中呢 😄

### 技术栈

- TypeScript
- Obsidian Plugin API
- marked (Markdown 解析)
- highlight.js (代码高亮)
- Claude API (AI 功能)

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 类型检查
npm run typecheck

# Lint
npm run lint
```

---

## 常见问题

### Q: 插件完全免费吗？
A: 是的，100% 免费，所有功能都不收费。

### Q: AI 功能为什么需要 API Key？
A: AI 功能调用的是 Claude API，会产生费用。开发者不收取额外费用，用户自行付费使用。

### Q: 可以商用吗？
A: 可以，MIT 许可证允许商业使用。

### Q: 如何反馈问题？
A: 在 GitHub Issues 中提 issue，或者加微信群反馈。

### Q: 会一直维护吗？
A: 只要我还在写公众号，就会一直维护。欢迎贡献代码！

---

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

---

## 感谢

- [Obsidian](https://obsidian.md) - 伟大的笔记软件
- [marked](https://github.com/markedjs/marked) - Markdown 解析库
- [highlight.js](https://highlightjs.org/) - 代码高亮库
- [Claude](https://claude.ai/) - AI 能力支持

---

## 赞助

虽然插件免费，但如果你的钱包想"支持一下"，我也不拒绝 😄

- 📢 关注公众号：PM智圈|PMAIhub

---

## 许可证

MIT License - 想怎么用就怎么用

---

## 联系方式

- GitHub: [@popomonkey](https://github.com/popomonkey)
- 微信公众号：PM智圈|PMAIhub
- 邮箱：your-email@example.com

---

**如果觉得好用，记得给个 Star ⭐**
