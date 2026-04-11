/**
 * AI Service Module
 * 集成多种大模型 API 进行内容美化
 */

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  provider?: 'claude' | 'openai' | 'azure' | 'moonshot' | 'baichuan' | 'yi' | 'custom';
  apiUrl?: string;
}

export interface BeautifyOptions {
  style?: 'official' | 'casual' | 'tech' | 'creative';
  addTargetEmoji?: boolean;
  optimizeStructure?: boolean;
  tone?: 'professional' | 'friendly' | 'academic';
}

export interface TitleSuggestion {
  title: string;
  score?: number;
  reason?: string;
}

export interface BeautifyResult {
  content: string;
  originalLength: number;
  beautifiedLength: number;
  suggestions?: string[];
}

/**
 * AI 服务类
 */
export class AIService {
  private config: AIServiceConfig;
  private baseUrl: string;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.baseUrl = this.getBaseUrl(config.provider, config.apiUrl);
  }

  /**
   * 获取 API 基础 URL
   */
  private getBaseUrl(provider?: string, customUrl?: string): string {
    if (provider === 'custom' && customUrl) {
      return customUrl;
    }

    const urls: Record<string, string> = {
      'claude': 'https://api.anthropic.com/v1',
      'openai': 'https://api.openai.com/v1',
      'azure': '', // Azure 需要特殊处理
      'moonshot': 'https://api.moonshot.cn/v1',
      'baichuan': 'https://api.baichuan-ai.com/v1',
      'yi': 'https://dashscope.aliyuncs.com/api/v1',
    };

    return urls[provider || 'claude'] || 'https://api.anthropic.com/v1';
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查 API Key 是否配置
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 10;
  }

  /**
   * 调用 AI API
   */
  private async callAPI(messages: Array<{ role: string; content: string }>): Promise<string> {
    const provider = this.config.provider || 'claude';

    // 处理 Azure OpenAI 特殊情况
    if (provider === 'azure') {
      return this.callAzure(messages);
    }

    // 通义千问特殊处理
    if (provider === 'yi') {
      return this.callQwen(messages);
    }

    // Claude 格式
    if (provider === 'claude') {
      return this.callClaude(messages);
    }

    // OpenAI 兼容格式（OpenAI、Moonshot、Baichuan 等）
    return this.callOpenAICompatible(messages);
  }

  /**
   * Claude API
   */
  private async callClaude(messages: Array<{ role: string; content: string }>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-20250514',
        max_tokens: this.config.maxTokens || 4096,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  /**
   * OpenAI 兼容 API（OpenAI、Moonshot、Baichuan）
   */
  private async callOpenAICompatible(messages: Array<{ role: string; content: string }>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        max_tokens: this.config.maxTokens || 4096,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Azure OpenAI API
   */
  private async callAzure(messages: Array<{ role: string; content: string }>): Promise<string> {
    // Azure OpenAI 需要特殊的 URL 格式
    const azureUrl = this.config.apiUrl || '';
    const response = await fetch(`${azureUrl}/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        max_tokens: this.config.maxTokens || 4096,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * 通义千问 API
   */
  private async callQwen(messages: Array<{ role: string; content: string }>): Promise<string> {
    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-DashScope-Model': this.config.model || 'qwen-max',
      },
      body: JSON.stringify({
        model: this.config.model || 'qwen-max',
        input: { messages },
        parameters: {
          max_tokens: this.config.maxTokens || 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.output?.text || '';
  }

  /**
   * 美化 Markdown 内容
   */
  async beautify(markdown: string, options: BeautifyOptions = {}): Promise<BeautifyResult> {
    const {
      style = 'tech',
      addTargetEmoji = false,
      optimizeStructure = true,
      tone = 'professional',
    } = options;

    const styleGuide = {
      official: '正式、权威、适合企业发布',
      casual: '轻松、亲切、适合日常生活',
      tech: '专业、精确、适合技术文章',
      creative: '创意、生动、适合文艺创作',
    };

    const toneGuide = {
      professional: '专业严谨的语气',
      friendly: '友好亲切的语气',
      academic: '学术规范的语气',
    };

    const prompt = `你是一位专业的内容编辑，请为微信公众号美化以下 Markdown 文章。

**要求：**
1. 文章风格：${styleGuide[style]}
2. 语言语气：${toneGuide[tone]}
3. ${optimizeStructure ? '优化文章结构（标题层级、段落分布、逻辑流畅）' : '保持原有结构'}
4. ${addTargetEmoji ? '在适当位置添加 emoji 增加可读性' : '保持简洁，不添加 emoji'}
5. 保持原文核心意思不变
6. 使用适合移动端阅读的短段落
7. 为重要观点添加强调格式

**输出格式：**
只返回美化后的 Markdown 内容，不要有任何解释或说明。

---

${markdown}`;

    const result = await this.callAPI([
      { role: 'user', content: prompt },
    ]);

    return {
      content: result || markdown,
      originalLength: markdown.length,
      beautifiedLength: result?.length || markdown.length,
    };
  }

  /**
   * 生成标题建议
   */
  async generateTitles(markdown: string, count: number = 10): Promise<TitleSuggestion[]> {
    const prompt = `请为以下微信公众号文章生成 ${count} 个吸引人的标题建议。

**要求：**
1. 标题要吸引眼球，符合公众号爆款标题特点
2. 可以使用数字、疑问、对比等技巧
3. 长度控制在 15-25 字之间
4. 避免标题党和夸大

**输出格式：**
每行一个标题，不要编号，不要解释。

---

${markdown}`;

    const result = await this.callAPI([
      { role: 'user', content: prompt },
    ]);

    return result
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, count)
      .map(title => ({ title }));
  }

  /**
   * 生成文章摘要
   */
  async generateDigest(markdown: string): Promise<string> {
    const prompt = `请为以下文章生成一段 50-100 字的摘要，适合放在微信公众号文章开头。

**要求：**
1. 概括文章核心内容
2. 吸引读者继续阅读
3. 语言简洁有力
4. 字数控制在 50-100 字

**输出格式：**
只返回摘要内容，不要有任何解释。

---

${markdown}`;

    const result = await this.callAPI([
      { role: 'user', content: prompt },
    ]);

    return result || '';
  }

  /**
   * 校对错别字
   */
  async proofread(markdown: string): Promise<{ corrected: string; changes: string[] }> {
    const prompt = `请校对以下 Markdown 文章，找出并修正错别字、语法错误和标点符号问题。

**要求：**
1. 只修正明显的错别字和语法错误
2. 保持原文风格和表达方式
3. 不要大幅改写

**输出格式：**
先返回修正后的完整 Markdown 内容，然后换行，列出所有修改（格式：原词 → 新词）。

---

${markdown}`;

    const result = await this.callAPI([
      { role: 'user', content: prompt },
    ]);

    const parts = result.split('\n---\n');
    const corrected = parts[0] || result;
    const changes = parts[1] ? parts[1].split('\n').filter(line => line.trim()) : [];

    return { corrected, changes };
  }

  /**
   * 生成金句卡片内容
   */
  async extractQuotes(markdown: string, count: number = 3): Promise<string[]> {
    const prompt = `请从以下文章中提取 ${count} 个最值得分享的金句。

**要求：**
1. 金句要有深度、有启发性
2. 长度在 15-40 字之间
3. 适合制作成分享卡片
4. 可以稍作润色使其更精炼

**输出格式：**
每行一个金句，不要编号，不要引号。

---

${markdown}`;

    const result = await this.callAPI([
      { role: 'user', content: prompt },
    ]);

    return result
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 100)
      .slice(0, count);
  }
}

/**
 * 创建 AI 服务实例
 */
export function createAIService(
  apiKey: string,
  model?: string,
  provider?: 'claude' | 'openai' | 'azure' | 'moonshot' | 'baichuan' | 'yi' | 'custom',
  apiUrl?: string
): AIService {
  return new AIService({ apiKey, model, provider, apiUrl });
}
