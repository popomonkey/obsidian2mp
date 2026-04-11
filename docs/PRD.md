# 产品需求文档 (PRD)

## Obsidian2MP - Obsidian 笔记推送微信公众号插件

**版本**: 0.0.1
**创建日期**: 2026-03-27
**作者**: liuym

---

## 1. 产品概述

### 1.1 产品定位

Obsidian2MP 是一款 Obsidian 插件，帮助用户将 Markdown 格式的笔记一键转换为微信公众号编辑器兼容的 HTML 格式，并支持在推送前调用 AI Skill 对内容进行美化和优化。

### 1.2 目标用户

- 使用 Obsidian 进行知识管理的公众号运营者
- 需要频繁将技术文档/笔记发布到公众号的开发者
- 希望提高公众号排版效率的内容创作者

### 1.3 核心价值

| 痛点 | 解决方案 |
|------|----------|
| Markdown 到公众号编辑器复制粘贴丢失格式 | 自动转换为微信公众号兼容的 HTML |
| 公众号排版样式单调 | 提供美观的默认样式模板 |
| 内容质量需要优化 | 集成 AI Skill 进行内容美化 |
| 每次发布流程繁琐 | 一键推送，减少操作步骤 |

---

## 2. 功能需求

### 2.1 功能架构图

```
Obsidian2MP
├── 核心推送模块
│   ├── ribbon 图标点击推送
│   └── 命令面板推送
├── Markdown 美化模块
│   ├── AI Skill 调用（Claude API 等）
│   └── 本地样式转换
├── HTML 转换模块
│   ├── Markdown 解析
│   └── 微信样式注入
├── 推送方式模块
│   ├── 剪贴板模式（MVP）
│   └── API 直接推送（后续）
└── 设置模块
    ├── 美化开关
    └── 公众号凭证配置
```

### 2.2 详细功能说明

#### F1: 推送当前笔记到微信公众号

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 触发方式 | 点击左侧 ribbon 图标 / 命令面板 |
| 输入 | 当前打开的 Markdown 笔记 |
| 处理流程 | 1. 获取笔记内容<br>2. 可选美化处理<br>3. 转换为微信 HTML<br>4. 复制到剪贴板 |
| 输出 | 微信公众号编辑器可识别的 HTML |
| 成功提示 | "HTML copied to clipboard! Paste it in WeChat MP editor" |
| 失败提示 | "Failed to push to WeChat MP. Check console for details." |

#### F2: Markdown 内容美化

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 触发方式 | 推送前自动触发 / 命令面板单独触发 |
| 输入 | Markdown 文本 |
| 处理流程 | 1. 调用 AI Skill（如 Claude API）<br>2. 获取美化后的内容<br>3. 替换原文 |
| 输出 | 优化后的 Markdown |
| 配置项 | `beautifyBeforePush` 开关 |

**美化能力范围**（由 AI Skill 提供）:
- 文章结构优化（标题层级、段落分布）
- 语言润色（更流畅的表达）
- 增加适合公众号的格式元素（引言、强调、分割线）
- 代码块高亮优化
- 添加合适的 emoji（可选）

#### F3: Markdown 转微信公众号 HTML

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 输入 | Markdown 文本 |
| 输出 | 带样式的 HTML |
| 样式规范 | 符合微信公众号编辑器兼容标准 |

**支持的 Markdown 元素及样式**:

| Markdown 语法 | HTML 输出 | 样式说明 |
|--------------|----------|----------|
| `# 标题 1` | `<section>` | 20px, 粗体, #333 |
| `## 标题 2` | `<section>` | 18px, 粗体, #444 |
| `### 标题 3` | `<section>` | 16px, 粗体, #555 |
| `**粗体**` | `<strong>` | 加粗 |
| `*斜体*` | `<em>` | 斜体 |
| `[文本](链接)` | `<a>` | #576b95, 下划线 |
| ` ```代码块``` ` | `<pre><code>` | 灰色背景，圆角 |
| `` `行内代码` `` | `<code>` | 浅灰背景 |
| `> 引用` | `<blockquote>` | 左侧边框 4px |

#### F4: 公众号凭证配置

| 项目 | 描述 |
|------|------|
| 优先级 | P1 |
| 配置项 | WeChat App ID |
| 配置项 | WeChat App Secret |
| 配置项 | WeChat Access Token（可选手动填写） |
| 用途 | 用于后续 API 直接推送功能 |

---

## 3. 技术方案

### 3.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 开发语言 | TypeScript |
| 构建工具 | Rollup |
| 目标平台 | Obsidian Plugin API |
| 依赖 | turndown（Markdown 转 HTML） |

### 3.2 核心接口设计

#### 3.2.1 美化 Skill 接口

```typescript
interface BeautifySkill {
  /**
   * 美化 Markdown 内容
   * @param markdown 原始 Markdown
   * @param options 美化选项
   */
  beautify(markdown: string, options?: BeautifyOptions): Promise<string>;
}

interface BeautifyOptions {
  style?: 'official' | 'casual' | 'tech';  // 风格
  addTargetEmoji?: boolean;                  // 添加 emoji
  optimizeStructure?: boolean;               // 优化结构
}
```

#### 3.2.2 微信公众号 API 接口（后续）

```typescript
interface WeChatMPClient {
  /**
   * 获取 access_token
   */
  getAccessToken(): Promise<string>;

  /**
   * 创建草稿
   * @param content 图文内容
   */
  createDraft(content: DraftContent): Promise<string>;

  /**
   * 上传图片到素材库
   */
  uploadImage(file: File): Promise<string>;
}

interface DraftContent {
  title: string;
  content: string;  // HTML
  cover?: string;
  digest?: string;
}
```

### 3.3 数据流

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Obsidian      │────▶│  Obsidian2MP    │────▶│   AI Skill      │
│   Markdown      │     │   Plugin        │     │   (可选)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Markdown ->    │
                       │  WeChat HTML    │
                       └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼                               ▼
       ┌─────────────────┐           ┌─────────────────┐
       │   剪贴板模式    │           │   API 推送模式  │
       │   (MVP)         │           │   (后续)        │
       └─────────────────┘           └─────────────────┘
```

---

## 4. 发布计划

### Phase 1: MVP (v0.1.0)

- [x] 项目骨架搭建
- [x] 基础 Markdown 转 HTML 功能
- [x] 剪贴板复制功能
- [x] 设置界面
- [ ] 美化功能占位

### Phase 2: AI 美化 (v0.2.0)

- [ ] 集成 Claude API 进行内容美化
- [ ] 提供多种美化风格选项
- [ ] 支持选中内容单独美化

### Phase 3: API 推送 (v0.3.0)

- [ ] 微信公众号 API 对接
- [ ] 获取 access_token
- [ ] 创建草稿箱
- [ ] 图片素材管理

### Phase 4: 增强功能 (v0.4.0+)

- [ ] 自定义样式模板
- [ ] 一键多平台发布（知乎、掘金等）
- [ ] 发布历史记录
- [ ] 定时发布

---

## 5. 风险与依赖

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 微信公众号 HTML 兼容性 | 高 | 充分测试各种元素渲染效果 |
| AI API 调用延迟 | 中 | 提供超时和降级方案 |
| 图片上传处理复杂 | 中 | MVP 阶段先手动处理图片 |

### 5.2 外部依赖

- Obsidian Plugin API 稳定性
- 微信公众号接口权限（需要认证的服务号）
- AI 服务可用性

---

## 6. 验收标准

### 6.1 功能验收

1. 点击 ribbon 图标能将当前笔记转换为 HTML 并复制到剪贴板
2. 粘贴到微信公众号编辑器后格式正确显示
3. 美化开关能正常控制是否调用美化功能
4. 设置能正确保存和加载

### 6.2 性能验收

- 单次推送耗时 < 3 秒（不含 AI 美化）
- AI 美化耗时 < 10 秒

### 6.3 兼容性验收

- Obsidian 0.15.0+ 正常运行
- 桌面端和移动端均支持

---

## 附录

### A. 微信公众号官方文档

- [公众号编辑器说明](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [素材管理接口](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_temporary_materials.html)
- [草稿箱接口](https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html)

### B. 相关文件

- `manifest.json` - 插件清单
- `src/main.ts` - 主逻辑
- `src/settings.ts` - 设置界面
