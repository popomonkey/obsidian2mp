# 测试笔记 - Obsidian2MP v0.2.0

这是一篇用于测试 Obsidian2MP 插件功能的测试笔记。

## 一级标题测试

这是正文内容。Obsidian2MP 是一款专为 Obsidian 用户设计的多平台发布工具。

### 三级标题测试

正文支持 **粗体**、*斜体* 和 [链接](https://github.com) 等格式。

## 代码块测试

### TypeScript 代码

```typescript
interface Article {
  title: string;
  content: string;
  tags: string[];
}

const article: Article = {
  title: "Hello Obsidian2MP",
  content: "这是一篇测试文章",
  tags: ["Obsidian", "WeChat"]
};

console.log(article.title);
```

### Python 代码

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("Obsidian2MP"))
```

### JavaScript 代码

```javascript
const fs = require('fs');
const path = require('path');

async function readFile(filePath) {
  return await fs.promises.readFile(filePath, 'utf-8');
}
```

## 行内代码测试

使用 `console.log()` 输出调试信息，或者用 `npm install` 安装依赖。

## 引用测试

> 教育的本质，就是点燃一把火。
>
> — 苏格拉底

## 列表测试

### 无序列表

- 第一项
- 第二项
- 第三项
  - 子项 1
  - 子项 2

### 有序列表

1. 第一步
2. 第二步
3. 第三步

## 表格测试

| 功能 | 状态 | 优先级 |
|------|------|--------|
| 主题系统 | ✅ 完成 | P0 |
| 代码高亮 | ✅ 完成 | P0 |
| 预览窗口 | ✅ 完成 | P0 |
| AI 美化 | 🚧 进行中 | P1 |
| API 推送 | 📅 计划中 | P2 |

---

## 分割线测试

上面是一条分割线。
