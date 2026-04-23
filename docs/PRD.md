# 产品需求文档 (PRD)

## Obsidian2MP - Obsidian 笔记多平台发布插件

**版本**: 0.4.0
**创建日期**: 2026-03-27
**更新日期**: 2026-04-22
**作者**: liuym

---

## 1. 产品概述

### 1.1 产品定位

Obsidian2MP 是一款 Obsidian 插件，帮助用户将 Markdown 格式的笔记一键转换为多种平台兼容的格式（微信公众号 HTML、飞书文档、Notion 页面等），并提供美观的默认样式模板。

### 1.2 目标用户

- 使用 Obsidian 进行知识管理的公众号运营者
- 需要频繁将技术文档/笔记发布到多个平台的内容创作者
- 希望提高排版效率的开发者和写作者

### 1.3 核心价值

| 痛点 | 解决方案 |
|------|----------|
| Markdown 到公众号编辑器复制粘贴丢失格式 | 自动转换为微信公众号兼容的 HTML |
| 公众号排版样式单调 | 提供多种美观的默认样式主题 |
| 多平台发布流程繁琐 | 一键预览和发布到微信、飞书、Notion |
| 每次发布流程繁琐 | 提供预览窗口，支持实时预览和快速发布 |

---

## 2. 功能需求

### 2.1 功能架构图

```
Obsidian2MP
├── 核心推送模块
│   ├── ribbon 图标点击推送
│   └── 命令面板推送
├── Markdown 转换模块
│   ├── Markdown 解析 (marked)
│   ├── 代码高亮 (highlight.js)
│   └── 主题样式注入
├── HTML 转换模块
│   ├── 微信公众号 HTML 转换
│   ├── 飞书 Markdown 适配
│   └── Notion 页面转换
├── 多平台发布模块
│   ├── 微信公众号 API（草稿箱）
│   ├── 飞书文档 API
│   └── Notion API
├── 预览窗口模块
│   ├── 实时预览
│   ├── 主题切换
│   ├── 平台切换
│   └── 封面图选择
└── 设置模块
    ├── 默认主题配置
    ├── 默认平台配置
    ├── 微信公众号凭证配置
    ├── 飞书凭证配置
    └── Notion 凭证配置
```

### 2.2 详细功能说明

#### F1: 推送当前笔记到微信公众号

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 触发方式 | 点击左侧 ribbon 图标 / 命令面板 |
| 输入 | 当前打开的 Markdown 笔记 |
| 处理流程 | 1. 获取笔记内容<br>2. 转换为微信 HTML<br>3. 复制到剪贴板 |
| 输出 | 微信公众号编辑器可识别的 HTML |
| 成功提示 | "✅ HTML copied to clipboard! Paste it in WeChat MP editor" |
| 失败提示 | "Failed to push to WeChat MP. Check console for details." |

#### F2: Markdown 转微信公众号 HTML

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 输入 | Markdown 文本 |
| 输出 | 带样式的 HTML |
| 样式规范 | 符合微信公众号编辑器兼容标准 |

**支持的 Markdown 元素及样式**:

| Markdown 语法 | HTML 输出 | 样式说明 |
|--------------|----------|----------|
| `# 标题 1` | `<section>` | 20px, 粗体，左侧色条装饰 |
| `## 标题 2` | `<section>` | 18px, 粗体，渐变背景 |
| `### 标题 3` | `<section>` | 16px, 粗体，左侧色条 |
| `**粗体**` | `<strong>` | 主题色加粗 |
| `*斜体*` | `<em>` | 斜体，灰色 |
| `[文本](链接)` | `<a>` | 主题色，下划线 |
| ` ```代码块``` ` | `<pre><code>` | Mac 窗口风格，带语言标签 |
| `` `行内代码` `` | `<code>` | 浅色背景，主题色边框 |
| `> 引用` | `<blockquote>` | 左侧边框，渐变背景 |
| `- 列表项` | `<ul><li>` | 自定义圆点样式 |
| `1. 列表项` | `<ol><li>` | 数字序号 |
| `---` | `<hr>` | 主题色分割线 |
| `表格` | `<table>` | 带阴影和圆角 |

#### F3: 多平台发布

| 平台 | 支持情况 | 发布方式 |
|------|---------|---------|
| 微信公众号 | ✅ 完整支持 | API 创建草稿箱 / 剪贴板复制 |
| 飞书文档 | ✅ 完整支持 | API 创建文档 |
| Notion | ✅ 完整支持 | API 创建页面 |

**微信公众号发布流程**:
1. 检查配置（AppID、AppSecret）
2. 提取笔记标题和摘要
3. 读取 frontmatter 中的 `thumb_media_id` 作为封面
4. 调用 API 创建草稿
5. 返回草稿链接并自动打开

**飞书发布流程**:
1. 检查配置（AppID、AppSecret）
2. 转换 Markdown 为飞书富文本格式
3. 调用 API 创建云文档
4. 返回文档链接并自动打开

**Notion 发布流程**:
1. 检查配置（Integration Token）
2. 转换 Markdown 为 Notion Block 结构
3. 调用 API 创建页面
4. 返回页面链接并自动打开

#### F4: 预览窗口

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 触发方式 | Ribbon 图标 / 命令面板 |
| 功能 | 实时预览、主题切换、平台切换、封面图选择、一键发布 |

**预览窗口特性**:
- 实时渲染 Markdown 为 HTML
- 支持多种主题切换（科技蓝、清新绿、优雅黑等）
- 支持多平台预览效果切换
- 支持从本地或素材库选择封面图
- 支持一键发布到配置的平台

#### F5: 公众号凭证配置

| 项目 | 描述 |
|------|------|
| 优先级 | P0 |
| 配置项 | WeChat App ID |
| 配置项 | WeChat App Secret |
| 配置项 | WeChat Access Token（可选手动填写） |
| 配置项 | 测试连接按钮 |
| 用途 | 用于 API 直接推送功能 |

#### F6: 飞书凭证配置

| 项目 | 描述 |
|------|------|
| 优先级 | P1 |
| 配置项 | Feishu App ID |
| 配置项 | Feishu App Secret |
| 配置项 | 测试连接按钮 |
| 用途 | 用于 API 创建飞书文档 |

#### F7: Notion 凭证配置

| 项目 | 描述 |
|------|------|
| 优先级 | P1 |
| 配置项 | Integration Token |
| 配置项 | Parent Page ID（可选） |
| 配置项 | Database ID（可选） |
| 配置项 | 测试连接按钮 |
| 用途 | 用于 API 创建 Notion 页面 |

---

## 3. 技术方案

### 3.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 开发语言 | TypeScript |
| 构建工具 | Rollup |
| 目标平台 | Obsidian Plugin API |
| Markdown 解析 | marked |
| 代码高亮 | highlight.js |

### 3.2 核心接口设计

#### 3.2.1 微信公众号 API 接口

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
  createDraft(content: DraftContent): Promise<{ mediaId: string; url: string }>;

  /**
   * 上传图片到素材库
   */
  uploadImageFromLocal(filePath: string, fileName: string): Promise<UploadImageResult>;
  uploadImageFromUrl(imageUrl: string): Promise<UploadImageResult>;
}

interface DraftContent {
  title: string;
  content: string;  // HTML
  coverMediaId?: string;
  digest?: string;
  author?: string;
  showCover?: boolean;
}
```

#### 3.2.2 飞书 API 接口

```typescript
interface FeishuClient {
  /**
   * 获取 access_token
   */
  getAccessToken(): Promise<string>;

  /**
   * 创建文档
   */
  createDocument(title: string, content: string): Promise<{ documentId: string; url: string }>;
}
```

#### 3.2.3 Notion API 接口

```typescript
interface NotionClient {
  /**
   * 创建页面
   */
  createPage(parent: { page_id?: string; database_id?: string }, properties: any, children: any[]): Promise<{ id: string; url: string }>;
}
```

### 3.3 数据流

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Obsidian      │────▶│  Obsidian2MP    │────▶│  Preview Modal  │
│   Markdown      │     │   Plugin        │     │   (实时预览)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Markdown ->    │
                       │  Platform HTML  │
                       └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
       ┌─────────────────┐ ┌─────────┐ ┌─────────────┐
       │   微信公众号    │ │  飞书   │ │    Notion   │
       │   (HTML)        │ │(Markdown)│ │  (Blocks)   │
       └─────────────────┘ └─────────┘ └─────────────┘
```

---

## 4. 发布计划

### Phase 1: MVP (v0.1.0) ✅

- [x] 项目骨架搭建
- [x] 基础 Markdown 转 HTML 功能
- [x] 剪贴板复制功能
- [x] 设置界面

### Phase 2: 主题系统 (v0.2.0) ✅

- [x] 多主题支持（科技蓝、清新绿、优雅黑等）
- [x] 主题切换功能
- [x] 代码高亮优化（Mac 窗口风格）

### Phase 3: 多平台发布 (v0.3.0) ✅

- [x] 微信公众号 API 对接
- [x] 飞书文档 API 对接
- [x] Notion API 对接
- [x] 预览窗口（支持平台切换）

### Phase 4: 增强功能 (v0.4.0) ✅

- [x] 封面图选择（本地/素材库）
- [x] 一键发布到配置的平台
- [x] 测试连接功能
- [x] 关注公众号引流

---

## 5. 风险与依赖

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 微信公众号 HTML 兼容性 | 高 | 充分测试各种元素渲染效果 |
| CORS 问题 | 中 | 使用 requestUrl 绕过浏览器限制 |
| 图片上传处理复杂 | 中 | 优先使用 thumb_media_id，手动上传封面 |

### 5.2 外部依赖

- Obsidian Plugin API 稳定性
- 微信公众号接口权限（需要认证的服务号）
- 飞书开放平台 API
- Notion API

---

## 6. 验收标准

### 6.1 功能验收

1. 点击 ribbon 图标能将当前笔记转换为 HTML 并复制到剪贴板
2. 粘贴到微信公众号编辑器后格式正确显示
3. 预览窗口能正常显示渲染效果
4. 支持切换主题和平台
5. 配置保存和加载正常
6. 微信公众号 API 能成功创建草稿
7. 飞书 API 能成功创建文档
8. Notion API 能成功创建页面

### 6.2 性能验收

- 单次推送耗时 < 3 秒（不含 API 调用）
- API 调用耗时取决于网络和平台响应
- 预览渲染即时完成

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
- `src/ui/preview-modal.ts` - 预览窗口
- `src/platforms/` - 多平台适配器
- `src/converter/` - Markdown 转换器
