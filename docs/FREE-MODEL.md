# Obsidian2MP - 免费插件运营模式

## 最终决定：完全免费

经过分析中国市场实际情况，决定采用**完全免费 + 打赏**的模式，放弃会员收费系统。

---

## 决策原因

### 市场现实

1. **中国用户付费意愿低**
   - 工具类插件付费率约 1-3%
   - 免费替代品遍地都是（md2wechat、markdown nice 等）
   - 用户觉得"插件就该免费"

2. **竞品分析**
   - md2wechat.cn - 免费版功能齐全
   - 壹伴、135 编辑器 - 基础功能免费
   - 付费版￥99/年 已是天花板

3. **Obsidian 社区文化**
   - 大部分优质插件都是免费的
   - 用户习惯免费使用
   - 收费容易被喷

### 免费的优势

1. **用户增长快** - 零门槛，容易传播
2. **口碑好** - "完全免费"是最好的宣传语
3. **无维护成本** - 不用搞支付、客服、投诉处理
4. **积累影响力** - GitHub Star、个人品牌

---

## 变现方式（替代方案）

### 1. 打赏/赞助 ☕

**实现方式**：
- 设置页面放"打赏开发者"按钮
- 用户主动点击才显示收款码
- 完全不打扰用户

**预期收入**：
- 1000 用户 → 约 5-20 人打赏（自愿）
- 平均￥10-20/人
- 月收入￥50-400（仅供参考）

**代码实现**：
```typescript
// src/donation.ts
export function createDonationSetting(containerEl: HTMLElement, app: any): void {
  new Setting(containerEl)
    .setName('☕ 打赏开发者')
    .setDesc('本插件完全免费，如果对你有帮助，可以自愿打赏支持')
    .addButton(button => {
      button.setButtonText('打赏').onClick(() => showDonationModal(app));
    });
}
```

### 2. 接私活 💼

**展示方式**：
- README 留联系方式
- 设置页面"关于"区域
- GitHub Profile

**收入**：
- 定制开发：￥2000-5000/单
- 企业咨询：￥500/小时

### 3. 知识付费 📚

**方向**：
- 写小册子教人写 Obsidian 插件
- 公众号写技术文章引流
- 录视频课程

**收入**：
- 小册子：￥49-99/份
- 课程：￥199-499/份

### 4. 主业发展 🎯

**价值**：
- GitHub 作品展示（面试加分）
- 技术博客素材
- 个人品牌背书

**回报**：
- 找工作更容易
- 谈薪有底气
- 涨薪 20-50%

---

## 已实现的功能

### 核心功能（全部免费）

| 功能 | 说明 | 成本 |
|------|------|------|
| Markdown 转微信公众号 | 3 种主题可选 | 免费 |
| 代码语法高亮 | highlight.js | 免费 |
| 预览窗口 | 实时预览效果 | 免费 |
| 多平台发布 | 微信/知乎/掘金 | 免费 |
| AI 内容润色 | 需 Claude API Key | 用户自付 |
| AI 标题生成 | 需 Claude API Key | 用户自付 |
| AI 摘要生成 | 需 Claude API Key | 用户自付 |
| AI 校对 | 需 Claude API Key | 用户自付 |

> 注意：AI 功能需要用户自行配置 Claude API Key，费用直接付给 Anthropic

---

## 代码结构

```
src/
├── main.ts                 # 插件入口
├── settings.ts             # 设置页面（含打赏入口）
├── donation.ts             # 打赏模块（新增）
├── converter/
│   ├── markdown.ts         # Markdown 转 HTML
│   └── theme.ts            # 主题定义
├── platforms/
│   ├── base.ts             # 平台适配器基类
│   ├── wechat.ts           # 微信公众号
│   ├── zhihu.ts            # 知乎
│   └── juejin.ts           # 掘金
├── ai/
│   ├── service.ts          # AI 服务
│   └── prompts.ts          # 提示词模板
└── ui/
    └── preview-modal.ts    # 预览窗口
```

**已删除**：
- ~~src/license/~~ - 会员验证模块
- ~~server/~~ - 服务端 API

---

## 打赏引导实现

### 设置页面入口

```typescript
// src/settings.ts
createDonationSetting(containerEl, this.app);
```

### 打赏弹窗

```typescript
// src/donation.ts
export function showDonationModal(app: any): void {
  const modal = new DonationModal(app);
  modal.open();
}
```

### 使用次数提醒

```typescript
// src/main.ts
maybeShowDonationReminder(); // 每 10 次显示一次
```

---

## README 文案

```markdown
# Obsidian2MP - 完全免费

> 一款完全免费的 Obsidian 插件，将笔记一键推送到微信公众号

## 💖 完全免费

本插件**完全免费**，由开发者用爱发电维护。

如果你觉得这个插件对你有帮助，可以通过以下方式支持：

- ⭐ 在 GitHub 上给个 Star
- ☕ [打赏一杯咖啡](docs/DONATION.md)
- 📢 推荐给你身边写公众号的朋友
```

---

## 收入对比

| 模式 | 月收入 | 维护成本 | 用户增长 |
|------|--------|----------|----------|
| 会员收费（原价） | ￥500-2000 | 高 | 慢 |
| 免费 + 打赏 | ￥100-600 | 低 | 快 |
| 完全免费 | ￥0 | 最低 | 最快 |

**建议**：先采用**完全免费**积累用户，有影响力后再考虑变现。

---

## 下一步

### 必做
- [ ] 替换收款码（docs/DONATION.md）
- [ ] 更新 README 中的联系方式
- [ ] 发布到 Obsidian 插件市场
- [ ] 写推广文章（公众号/知乎/掘金）

### 可选
- [ ] 建用户交流群
- [ ] 定期更新版本
- [ ] 收集用户反馈

---

## 总结

**免费不是终点，而是起点。**

通过免费插件：
- 积累用户和影响力
- 建立个人品牌
- 获得潜在机会

**比直接收费更赚钱。**

---

*文档更新时间：2026-03-27*
