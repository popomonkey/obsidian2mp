# Obsidian2MP

> 将 Obsidian 笔记推送到微信公众号、知乎专栏、掘金、飞书的插件，支持 AI 美化、多平台发布

![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 功能特性

### v0.4.0 新增

- 📄 **飞书文档支持**：Markdown 格式转换、API 创建云文档
- 🤖 **AI 美化**：内容润色、标题生成、摘要提取、错别字校对
- 📱 **多平台发布**：微信公众号、知乎专栏、掘金、飞书文档
- 🔌 **API 直连**：微信公众号/飞书文档 API 集成（需配置凭证）
- 🎨 **主题系统**：3 种预设排版主题（技术蓝/极客黑/简约灰）
- 🖥️ **代码高亮**：highlight.js 集成，Mac 窗口风格
- 👁️ **预览窗口**：实时预览转换效果

### 核心功能

- 📤 **一键推送**：将 Markdown 笔记转换为微信公众号兼容的 HTML 格式
- ✨ **AI 美化**：支持在推送前调用 Claude AI 服务美化内容（需配置 API Key）
- 📋 **剪贴板模式**：自动复制 HTML 到剪贴板，直接粘贴到公众号编辑器
- 🔌 **API 推送**：配置公众号凭证后直接创建草稿

## 截图预览

### 主题预览

| 技术蓝 | 极客黑 | 简约灰 |
|--------|--------|--------|
| 清爽专业 | 深色极客 | 简约优雅 |

### 代码块样式

```
┌─────────────────────────────────┐
│ ● ● ●  TypeScript               │
├─────────────────────────────────┤
│ const hello = "world";          │
│ console.log(hello);             │
└─────────────────────────────────┘
```

## 安装

### 从 BRAT 安装（推荐）

1. 在 Obsidian 中安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 添加此仓库地址：`https://github.com/popomonkey/obsidian2mp`

### 手动安装

1. 下载最新 release 的 `.zip` 文件
2. 解压到 Obsidian 插件目录：`vault/.obsidian/plugins/obsidian2mp/`
3. 在 Obsidian 设置中启用插件

## 使用方法

### 快速推送（使用默认主题）

1. 打开任意笔记
2. 使用命令面板：`Quick Push: Convert and copy HTML`
3. HTML 将自动复制到剪贴板

### 预览模式（推荐）

1. 打开任意笔记
2. 点击左侧边栏的微信图标，或使用命令面板：
   - `Preview: Push current note to WeChat MP`
3. 在预览窗口中：
   - 切换发布平台（微信/知乎/掘金/飞书）
   - 切换主题样式（仅微信）
   - 调整字号大小（仅微信）
4. 点击「复制」按钮或「自动发布」按钮

### 自动发布（需配置 API）

1. 打开设置 → Obsidian2MP
2. 配置对应平台的 API 凭证：
   - **微信公众号**：填写 AppID 和 AppSecret
   - **飞书文档**：填写 App ID 和 App Secret
3. 打开预览窗口，选择对应平台
4. 确认配置提示显示"✅ 已配置 API，可直接发布"
5. 点击「自动发布」按钮

> 💡 **注意**：知乎专栏和掘金暂不支持 API 发布，需要使用复制方式。

### AI 功能

需要配置 Claude API Key：
1. 打开设置 → Obsidian2MP
2. 输入 Claude API Key
3. 使用以下功能：
   - `AI: Beautify selected text` - 美化选中文字
   - `AI: Generate title suggestions` - 生成标题建议
   - `AI: Generate article digest` - 生成文章摘要
   - `AI: Proofread selected text` - 校对选中文字

### 设置

在设置中找到 `Obsidian2MP`，可以配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| 默认主题 | 技术蓝/极客黑/简约灰 | 技术蓝 |
| 默认发布平台 | 微信公众号/知乎/掘金/飞书文档 | 微信公众号 |
| 预览窗口大小 | 小/中/大 | 中 |
| 推送前美化 | 是否启用 AI 美化 | 开启 |
| Claude API Key | AI 美化所需的 API 密钥 | - |
| 微信公众号 AppID | 用于直接 API 发布 | - |
| 微信公众号 AppSecret | 用于直接 API 发布 | - |
| 飞书文档 App ID | 用于直接 API 发布 | - |
| 飞书文档 App Secret | 用于直接 API 发布 | - |

## 主题说明

### 技术蓝

- **主色调**：`#1e80ff`
- **适用场景**：技术教程、产品介绍
- **特点**：清爽专业，蓝色系

### 极客黑

- **主色调**：`#24292f`
- **适用场景**：代码密集型文章
- **特点**：深色背景，代码高亮效果最佳

### 简约灰

- **主色调**：`#576b95`
- **适用场景**：通用、文艺类内容
- **特点**：简约优雅，适合大多数场景

## 支持的平台

| 平台 | 格式 | API 发布 | 特点 |
|------|------|------|------|
| 微信公众号 | HTML | ✅ 支持 | 带样式、代码高亮、主题切换 |
| 飞书文档 | Markdown | ✅ 支持 | 团队协作、API 创建文档 |
| 知乎专栏 | Markdown | ❌ 不支持 | 原生支持、LaTeX 公式 |
| 掘金 | Markdown | ❌ 不支持 | 原生支持、mermaid 图表 |

> 💡 **提示**：不支持 API 发布的平台，可以使用复制功能手动粘贴。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听变化自动编译）
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

## 版本历史

详见 [CHANGELOG.md](CHANGELOG.md)

### v0.4.0 (2026-03-28)

- ✅ 飞书文档支持（Markdown 转换 + API 创建文档）
- ✅ 微信公众号 API 草稿创建
- ✅ 预览窗口添加「自动发布」按钮
- ✅ 新增平台配置指南文档

### v0.3.0 (2026-03-27)

- ✅ AI 内容润色、标题生成、摘要提取、校对
- ✅ 多平台发布（微信/知乎/掘金）
- ✅ 微信公众号 API 客户端

### v0.2.0 (2026-03-27)

- ✅ 主题系统（3 种预设主题）
- ✅ highlight.js 代码高亮
- ✅ 预览窗口

### v0.1.0 (2026-03-27)

- ✅ 项目骨架搭建
- ✅ 基础 Markdown 转 HTML

## 反馈与支持

如有问题或建议，请提交 [Issue](https://github.com/popomonkey/obsidian2mp/issues)。

## License

MIT
