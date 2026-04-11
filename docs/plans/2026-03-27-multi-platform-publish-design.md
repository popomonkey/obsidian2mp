# Obsidian2MP 多平台发布系统设计

**版本**: 0.1.0
**创建日期**: 2026-03-27
**作者**: liuym
**状态**: 设计评审中

---

## 1. 产品概述

### 1.1 产品定位

Obsidian2MP 是一款专为 Obsidian 用户设计的多平台发布工具，帮助用户将 Markdown 格式的笔记一键转换为多个内容平台（微信公众号、知乎、掘金等）兼容的格式，并支持 AI 内容优化和直接发布。

### 1.2 目标用户

| 用户类型 | 特征 | 核心需求 |
|---------|------|---------|
| **知识创作者** | 使用 Obsidian 进行知识管理，同时在多个平台分享内容 | 一次写作，多平台发布 |
| **公众号作者** | 技术类公众号运营者 | 高质量的代码展示、专业的排版 |
| **新媒体团队** | 需要协作审稿、多账号管理 | 工作流协同、效率工具 |

### 1.3 核心价值主张

```
Obsidian 笔记 → 深度优化 → 多平台适配 → 一键发布
```

| 痛点 | 解决方案 |
|------|---------|
| Markdown 到各平台格式不兼容 | 自动转换为目标平台兼容格式 |
| 各平台排版风格不一致 | 统一主题系统，保持品牌一致性 |
| 内容质量需要优化 | AI 润色、标题生成、摘要提取 |
| 发布流程繁琐 | 一键多平台分发，减少操作步骤 |
| 图片处理麻烦 | 自动上传到图床/素材库 |

---

## 2. 市场分析

### 2.1 竞品分析

#### 在线工具领域

| 工具 | 多平台 | 付费模式 | Obsidian 集成 |
|------|--------|---------|--------------|
| 蚁小二 | ✅ 30+ 平台 | 30-50 元/月 | ❌ |
| 秀米 | ❌ 仅微信 | 25 元/月 VIP | ❌ |
| 135 编辑器 | ❌ 仅微信 | 数百元/年 | ❌ |
| OpenWrite | ✅ 多平台 | 付费 | ❌ |

#### Obsidian 插件领域

| 插件 | 功能 | 状态 |
|------|------|------|
| wechat-chat | 导出微信对话 | 活跃，但场景 niche |
| 各种导出插件 | Markdown→HTML/PDF | 活跃，非针对多平台 |

### 2.2 市场机会

**Obsidian 插件领域，目前没有成熟的「多平台发布」工具。**

Obsidian2MP 的差异化定位：
- 不是另一个蚁小二
- 而是「Obsidian 用户的最佳发布工具」

### 2.3 竞争优势

| 维度 | 蚁二小等竞品 | Obsidian2MP |
|------|-------------|-------------|
| 编辑体验 | 独立工具/网页 | Obsidian 内完成 |
| 知识管理 | 弱 | 强（双向链接/图谱） |
| 工作流 | 复制→粘贴→排版 | 一键转换→发布 |
| AI 能力 | 基础 | 深度集成 Claude |

---

## 3. 功能需求

### 3.1 功能架构

```
Obsidian2MP
├── 核心转换模块
│   ├── Markdown 解析
│   ├── 主题系统
│   └── 代码高亮 (highlight.js)
├── 平台适配模块
│   ├── 微信公众号
│   ├── 知乎
│   ├── 掘金
│   └── 小红书 (后续)
├── AI 增强模块
│   ├── 内容润色
│   ├── 标题生成
│   └── 摘要提取
├── 发布模块
│   ├── 剪贴板模式 (MVP)
│   ├── API 直连发布
│   └── 定时发布 (后续)
└── 用户系统
    ├── 免费/会员权限
    └── 设置管理
```

### 3.2 免费功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 基础 Markdown 转 HTML | 核心转换功能 | P0 |
| 3 种预设主题 | 技术蓝/极客黑/简约灰 | P0 |
| 代码高亮 | highlight.js 集成 | P0 |
| 预览窗口 | 实时预览 + 切换主题 | P0 |
| 一键复制 | 复制到剪贴板 | P0 |
| 发布历史 | 基础记录 | P1 |

### 3.3 会员功能（Pro/Team）

| 功能 | 说明 | 优先级 |
|------|------|--------|
| AI 润色 | Claude API 优化内容 | P0 |
| 多平台分发 | 微信/知乎/掘金适配 | P0 |
| 自定义主题 | 用户自定义主色/间距 | P1 |
| 金句卡片模板 | 精美引用卡片 | P1 |
| API 直连推送 | 配置凭证后直接发布 | P1 |
| 图片自动上传 | 本地图片→图床/素材库 | P2 |
| 数据同步 | 同步阅读量/点赞数 | P2 |

---

## 4. 技术方案

### 4.1 技术栈

| 层级 | 技术选型 |
|------|---------|
| 开发语言 | TypeScript |
| 构建工具 | Rollup |
| 目标平台 | Obsidian Plugin API |
| Markdown 解析 | marked / remark |
| 代码高亮 | highlight.js |
| AI 服务 | Claude API |

### 4.2 核心接口设计

#### 4.2.1 主题接口

```typescript
interface WeChatTheme {
  id: 'tech-blue' | 'geek-black' | 'minimal-gray';
  name: string;
  colors: {
    primary: string;       // 主色调
    link: string;          // 链接颜色
    quoteBorder: string;   // 引用边框
    codeBg: string;        // 代码背景
    codeFg: string;        // 代码前景
  };
  fontSize: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
  };
}
```

#### 4.2.2 平台适配器接口

```typescript
interface PlatformAdapter {
  /**
   * 平台标识
   */
  id: string;

  /**
   * 平台名称
   */
  name: string;

  /**
   * 将 Markdown 转换为目标平台格式
   */
  convert(markdown: string, theme: WeChatTheme): Promise<string>;

  /**
   * 是否支持直接发布
   */
  supportsDirectPublish(): boolean;

  /**
   * 直接发布（如果支持）
   */
  publish(content: string, options: PublishOptions): Promise<PublishResult>;
}

interface PublishOptions {
  title: string;
  coverImage?: string;
  digest?: string;
  tags?: string[];
}

interface PublishResult {
  success: boolean;
  articleId?: string;
  url?: string;
  error?: string;
}
```

#### 4.2.3 AI 服务接口

```typescript
interface AIService {
  /**
   * 润色文章内容
   */
  polish(markdown: string, options: PolishOptions): Promise<string>;

  /**
   * 生成标题建议
   */
  generateTitles(markdown: string, count?: number): Promise<string[]>;

  /**
   * 生成文章摘要
   */
  generateDigest(markdown: string): Promise<string>;
}

interface PolishOptions {
  style?: 'official' | 'casual' | 'tech';
  addTargetEmoji?: boolean;
  optimizeStructure?: boolean;
}
```

### 4.3 目录结构

```
src/
├── main.ts                    # 插件入口
├── settings.ts                # 设置界面
├── converter/
│   ├── index.ts               # 转换入口
│   ├── markdown.ts            # Markdown 解析
│   ├── theme.ts               # 主题定义
│   └── code-highlight.ts      # 代码高亮
├── platforms/
│   ├── base.ts                # 平台适配器基类
│   ├── wechat.ts              # 微信公众号
│   ├── zhihu.ts               # 知乎
│   └── juejin.ts              # 掘金
├── ai/
│   ├── service.ts             # AI 服务封装
│   └── prompts.ts             # AI 提示词模板
├── ui/
│   ├── preview-modal.ts       # 预览弹窗
│   └── theme-selector.ts      # 主题选择器
└── utils/
    ├── clipboard.ts           # 剪贴板工具
    └── storage.ts             # 本地存储
```

---

## 5. UI 设计

### 5.1 预览窗口

```
┌────────────────────────────────────────┐
│  预览 - 你的笔记标题                    │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ▍ 一级标题                       │  │
│  │                                   │  │
│  │  正文内容...                       │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ ● ● ●  TypeScript            │  │  │
│  │  │ const x = 1;                │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│ 平台：[微信公众号 ▼]                     │
│ 主题：[技术蓝] [极客黑] [简约灰]        │
│ 字号：[14px] [15px] [16px]             │
│                                        │
│     [复制 HTML]    [直接发布]   [取消]   │
└────────────────────────────────────────┘
```

### 5.2 设置界面

| 配置项 | 类型 | 说明 |
|--------|------|------|
| 默认主题 | 下拉 | 技术蓝/极客黑/简约灰 |
| 默认平台 | 下拉 | 微信公众号/知乎/掘金 |
| 预览窗口大小 | 单选 | 小/中/大 |
| AI 润色开关 | 切换 | 启用/禁用 |
| Claude API Key | 文本 | 会员用户填写 |
| 公众号 AppID | 文本 | 用于直接发布 |
| 公众号 AppSecret | 文本 | 用于直接发布 |

---

## 6. 发布计划

### Phase 1: 基础排版系统 (v0.2.0)

**预计工时**: 1-2 周

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 项目重构 | P0 | 按新架构调整目录结构 |
| Markdown 解析器 | P0 | 引入 marked/remark |
| 主题系统 | P0 | 3 种预设主题 |
| 代码高亮 | P0 | highlight.js 集成 |
| 预览窗口 | P0 | Obsidian Modal 实现 |
| 设置界面扩展 | P1 | 新增主题/平台选择 |

### Phase 2: AI 增强 (v0.3.0)

**预计工时**: 1 周

| 任务 | 优先级 | 说明 |
|------|--------|------|
| Claude API 集成 | P0 | 调用 Claude API |
| 内容润色 | P0 | 文章结构优化、语言润色 |
| 标题生成 | P1 | 生成 10 个标题备选 |
| 摘要提取 | P1 | 自动生成文章摘要 |

### Phase 3: 微信公众号 API (v0.4.0)

**预计工时**: 1 周

| 任务 | 优先级 | 说明 |
|------|--------|------|
| Access Token 获取 | P0 | API 凭证管理 |
| 创建草稿 | P0 | 调用草稿箱接口 |
| 图片上传 | P1 | 素材管理接口 |
| 直接发布 | P1 | 取代剪贴板模式 |

### Phase 4: 多平台适配 (v0.5.0)

**预计工时**: 1-2 周

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 知乎适配器 | P0 | 知乎专栏格式 |
| 掘金适配器 | P0 | 掘金 Markdown |
| 平台选择器 | P1 | 预览窗口内切换 |
| 一键多平台 | P1 | 同时发布到多平台 |

### Phase 5: 会员系统 (v0.6.0)

**预计工时**: 1-2 周

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 许可证验证 | P0 | 会员状态检查 |
| 功能权限控制 | P0 | 免费/会员功能分离 |
| 支付集成 | P1 | 对接支付平台 |
| 数据同步 | P2 | 跨设备同步设置 |

---

## 7. 风险与依赖

### 7.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 微信公众号 API 权限 | 高 | 需要服务号认证，先做剪贴板模式 |
| 各平台接口变更 | 中 | 适配器模式，便于快速调整 |
| AI API 调用成本 | 中 | 限流、缓存、本地降级 |
| highlight.js 体积 | 低 | 按需加载常用语言 |

### 7.2 外部依赖

- Obsidian Plugin API 稳定性
- 微信公众号开放平台接口
- Claude API 可用性
- 各内容平台开放 API

---

## 8. 验收标准

### 8.1 功能验收

1. ✅ 点击 ribbon 图标能打开预览窗口
2. ✅ 预览窗口正确显示 Markdown 转换后的效果
3. ✅ 切换主题后实时预览效果变化
4. ✅ 点击复制能将正确格式的 HTML 复制到剪贴板
5. ✅ 粘贴到微信公众号编辑器后格式正确

### 8.2 性能验收

- 单次转换耗时 < 1 秒（不含 AI）
- AI 润色耗时 < 5 秒
- 预览窗口打开耗时 < 500ms

### 8.3 兼容性验收

- Obsidian 0.15.0+ 正常运行
- 桌面端和移动端均支持

---

## 9. 商业模式

### 9.1 会员体系

| 等级 | 价格 | 核心权益 |
|------|------|---------|
| **免费版** | 0 元 | 基础排版 +3 主题 + 代码高亮 + 预览 |
| **Pro 版** | 39 元/月<br>399 元/年 | AI 润色 + 多平台分发 + 自定义主题 + 金句卡片 |
| **Team 版** | 99 元/月 | 多账号 + 团队协作 + 数据同步 |

### 9.2 竞品对比

| 功能 | 蚁小二 | Obsidian2MP Pro |
|------|--------|-----------------|
| 价格 | 30-50 元/月 | 39 元/月 |
| 多平台 | 30+ | 首期 3 平台 |
| Obsidian 集成 | ❌ | ✅ |
| AI 能力 | 基础 | ✅ 深度集成 |
| 知识管理 | ❌ | ✅ |

---

## 10. 附录

### A. 微信公众号 API 文档

- [获取 access_token](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html)
- [草稿箱接口](https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html)
- [素材管理接口](https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/New_temporary_materials.html)

### B. 知乎专栏 API

- [知乎开放平台](https://developers.zhihu.com/)

### C. 掘金 API

- 掘金支持 Markdown 直接导入，无需特殊转换

### D. 相关文件

- `src/main.ts` - 插件主逻辑
- `src/settings.ts` - 设置界面
- `docs/PRD.md` - 产品需求文档

---

## 修订历史

| 版本 | 日期 | 作者 | 说明 |
|------|------|------|------|
| 0.1.0 | 2026-03-27 | liuym | 初始设计文档 |
