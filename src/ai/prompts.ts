/**
 * AI Prompts Module
 * 预定义的 AI 提示词模板
 */

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  variables: string[];
}

/**
 * 内置提示词模板
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  /**
   * 文章润色
   */
  polish: {
    id: 'polish',
    name: '文章润色',
    description: '优化文章结构、语言表达，提升可读性',
    prompt: `你是一位专业的内容编辑，请润色以下文章。

**要求：**
1. 优化文章结构（标题层级、段落分布）
2. 改进语言表达，使其更流畅
3. 保持原文核心意思
4. 使用适合移动端阅读的短段落
5. 为重要内容添加**强调**格式

只返回润色后的内容，不要解释。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 标题生成
   */
  titleGenerator: {
    id: 'titleGenerator',
    name: '标题生成',
    description: '生成 10 个吸引人的公众号标题',
    prompt: `请为以下文章生成 10 个吸引人的微信公众号标题。

**要求：**
1. 符合公众号爆款标题特点
2. 可以使用数字、疑问、对比等技巧
3. 长度 15-25 字
4. 避免标题党

每行一个标题，不要编号。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 摘要生成
   */
  digestGenerator: {
    id: 'digestGenerator',
    name: '摘要生成',
    description: '生成 50-100 字的文章摘要',
    prompt: `请为以下文章生成一段 50-100 字的摘要。

**要求：**
1. 概括核心内容
2. 吸引读者阅读
3. 语言简洁有力

只返回摘要内容。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 错别字校对
   */
  proofread: {
    id: 'proofread',
    name: '错别字校对',
    description: '校对错别字、语法和标点',
    prompt: `请校对以下文章，修正错别字、语法和标点错误。

**要求：**
1. 只修正明显错误
2. 保持原文风格
3. 不要大幅改写

返回修正后的内容，然后列出修改处。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 金句提取
   */
  quoteExtractor: {
    id: 'quoteExtractor',
    name: '金句提取',
    description: '提取 3-5 个值得分享的金句',
    prompt: `请从以下文章中提取 3-5 个最值得分享的金句。

**要求：**
1. 有深度、有启发性
2. 长度 15-40 字
3. 适合制作分享卡片

每行一个金句。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 风格转换 - 技术风
   */
  styleTech: {
    id: 'styleTech',
    name: '技术风格',
    description: '转换为专业技术文章风格',
    prompt: `请将以下文章改写为专业技术风格。

**要求：**
1. 使用专业术语
2. 逻辑严谨
3. 避免口语化表达
4. 适合技术人员阅读

只返回改写后的内容。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 风格转换 - 轻松风
   */
  styleCasual: {
    id: 'styleCasual',
    name: '轻松风格',
    description: '转换为轻松亲切的写作风格',
    prompt: `请将以下文章改写为轻松亲切的风格。

**要求：**
1. 使用口语化表达
2. 增加亲和力
3. 适当使用 emoji
4. 像和朋友聊天一样

只返回改写后的内容。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 小红书风格
   */
  xiaohongshuStyle: {
    id: 'xiaohongshuStyle',
    name: '小红书风格',
    description: '转换为小红书笔记风格',
    prompt: `请将以下内容改写为小红书笔记风格。

**要求：**
1. 标题吸引眼球，使用 emoji
2. 短段落，多换行
3. 大量 emoji 点缀
4. 使用"姐妹们"、"真的绝了"等网络用语
5. 文末添加相关 tag

只返回改写后的内容。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 知乎风格
   */
  zhihuStyle: {
    id: 'zhihuStyle',
    name: '知乎风格',
    description: '转换为知乎回答风格',
    prompt: `请将以下内容改写为知乎回答风格。

**要求：**
1. 开头点明观点
2. 逻辑清晰，有论证
3. 适当使用专业术语
4. 结尾总结升华

只返回改写后的内容。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 扩写
   */
  expand: {
    id: 'expand',
    name: '内容扩写',
    description: '将简短内容扩写成完整文章',
    prompt: `请将以下内容扩写成一篇完整的文章。

**要求：**
1. 保持核心观点
2. 增加论据和例子
3. 结构完整（引言、正文、结论）
4. 字数扩展到 800-1500 字

只返回扩写后的内容。

---

{{content}}`,
    variables: ['content'],
  },

  /**
   * 缩写
   */
  summarize: {
    id: 'summarize',
    name: '内容缩写',
    description: '将长文缩写成精简版',
    prompt: `请将以下长文缩写成 300 字以内的精简版。

**要求：**
1. 保留核心观点
2. 删除冗余内容
3. 语言精练
4. 字数控制在 300 字以内

只返回缩写后的内容。

---

{{content}}`,
    variables: ['content'],
  },
};

/**
 * 获取提示词模板
 */
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES[id];
}

/**
 * 获取所有模板列表
 */
export function getAllPromptTemplates(): PromptTemplate[] {
  return Object.values(PROMPT_TEMPLATES);
}

/**
 * 渲染提示词模板（替换变量）
 */
export function renderPrompt(template: PromptTemplate, variables: Record<string, string>): string {
  let prompt = template.prompt;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return prompt;
}

/**
 * 快速调用模板
 */
export async function usePrompt(
  templateId: string,
  variables: Record<string, string>,
  callClaude: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<string> {
  const template = getPromptTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const prompt = renderPrompt(template, variables);
  return callClaude([{ role: 'user', content: prompt }]);
}
