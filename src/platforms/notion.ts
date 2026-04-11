/**
 * Notion 平台适配器
 * 将 Markdown 转换为 Notion 块并支持 API 发布
 */

import { BasePlatformAdapter } from './base';
import type { ConvertOptions, PublishOptions, PublishResult } from './base';

/**
 * Notion 配置
 */
export interface NotionConfig {
  integrationToken?: string;
  databaseId?: string;
  parentPageId?: string;
}

/**
 * Notion 客户端
 */
export class NotionClient {
  private config: NotionConfig;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(config: NotionConfig = {}) {
    this.config = config;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<NotionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查配置是否完整
   */
  isConfigured(): boolean {
    return !!this.config.integrationToken;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.integrationToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    };
  }

  /**
   * 创建页面
   */
  async createPage(
    title: string,
    content: string,
    parentId?: string
  ): Promise<{
    success: boolean;
    pageId?: string;
    url?: string;
    error?: string;
  }> {
    if (!this.config.integrationToken) {
      return {
        success: false,
        error: '未配置 Notion Integration Token',
      };
    }

    try {
      // 构建父级对象
      const parent = parentId
        ? { parent: { page_id: parentId } }
        : this.config.databaseId
          ? { parent: { database_id: this.config.databaseId } }
          : { parent: { workspace: true } };

      // 创建页面请求体
      const body: Record<string, any> = {
        ...parent,
        properties: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        children: await this.parseMarkdownToBlocks(content),
      };

      const response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          pageId: data.id,
          url: data.url,
        };
      }

      return {
        success: false,
        error: data.message || '创建页面失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建页面失败',
      };
    }
  }

  /**
   * 将 Markdown 解析为 Notion Blocks
   * 简化的 Markdown 解析器
   */
  private async parseMarkdownToBlocks(markdown: string): Promise<any[]> {
    const blocks: any[] = [];
    const lines = markdown.split('\n');
    let currentListType: 'bulleted' | 'numbered' | null = null;
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLanguage = '';

    for (const line of lines) {
      // 代码块
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeLines = [];
        } else {
          inCodeBlock = false;
          blocks.push({
            code: {
              rich_text: [{ text: { content: codeLines.join('\n') } }],
              language: this.mapLanguage(codeLanguage),
            },
          });
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // 标题
      if (line.startsWith('# ')) {
        blocks.push({
          heading_1: {
            rich_text: [{ text: { content: line.slice(2) } }],
          },
        });
        continue;
      }

      if (line.startsWith('## ')) {
        blocks.push({
          heading_2: {
            rich_text: [{ text: { content: line.slice(3) } }],
          },
        });
        continue;
      }

      if (line.startsWith('### ')) {
        blocks.push({
          heading_3: {
            rich_text: [{ text: { content: line.slice(4) } }],
          },
        });
        continue;
      }

      // 有序列表
      if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, '');
        blocks.push({
          numbered_list_item: {
            rich_text: [{ text: { content } }],
          },
        });
        continue;
      }

      // 无序列表
      if (/^[-*+]\s/.test(line)) {
        const content = line.replace(/^[-*+]\s/, '');
        blocks.push({
          bulleted_list_item: {
            rich_text: [{ text: { content } }],
          },
        });
        continue;
      }

      // 引用
      if (line.startsWith('> ')) {
        blocks.push({
          quote: {
            rich_text: [{ text: { content: line.slice(2) } }],
          },
        });
        continue;
      }

      // 分隔线
      if (line === '---' || line === '***') {
        blocks.push({ divider: {} });
        continue;
      }

      // 空行
      if (line.trim() === '') {
        continue;
      }

      // 普通段落
      blocks.push({
        paragraph: {
          rich_text: this.parseInlineMarkdown(line),
        },
      });
    }

    return blocks;
  }

  /**
   * 解析行内 Markdown（粗体、斜体、链接、代码等）
   */
  private parseInlineMarkdown(text: string): any[] {
    const parts: any[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      // 粗体 **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push({
          text: { content: boldMatch[1], link: null },
          annotations: { bold: true },
        });
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // 斜体 *text*
      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        parts.push({
          text: { content: italicMatch[1], link: null },
          annotations: { italic: true },
        });
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // 行内代码 `code`
      const codeMatch = remaining.match(/^`(.+?)`/);
      if (codeMatch) {
        parts.push({
          text: { content: codeMatch[1], link: null },
          annotations: { code: true },
        });
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // 链接 [text](url)
      const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
      if (linkMatch) {
        parts.push({
          text: {
            content: linkMatch[1],
            link: { url: linkMatch[2] },
          },
        });
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // 普通文本（非标记部分）
      const nextMarkIndex = [
        remaining.indexOf('**'),
        remaining.indexOf('*'),
        remaining.indexOf('`'),
        remaining.indexOf('['),
      ]
        .filter((i) => i !== -1)
        .sort((a, b) => a - b)[0];

      if (nextMarkIndex === undefined || nextMarkIndex === 0) {
        // 如果下一个标记在开头，但上面的匹配都失败了，跳过这个字符
        parts.push({
          text: { content: remaining[0], link: null },
        });
        remaining = remaining.slice(1);
      } else {
        parts.push({
          text: { content: remaining.slice(0, nextMarkIndex), link: null },
        });
        remaining = remaining.slice(nextMarkIndex);
      }
    }

    return parts.length > 0 ? parts : [{ text: { content: text, link: null } }];
  }

  /**
   * 映射编程语言到 Notion 支持的语言
   */
  private mapLanguage(lang: string): string {
    const langMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      sh: 'shell',
      bash: 'shell',
      yml: 'yaml',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      php: 'php',
      swift: 'swift',
      kotlin: 'kotlin',
    };
    return langMap[lang.toLowerCase()] || 'plain text';
  }

  /**
   * 检查服务器状态
   */
  async checkServerStatus(): Promise<boolean> {
    try {
      if (!this.config.integrationToken) {
        return false;
      }
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Notion API check failed:', error);
      return false;
    }
  }
}

/**
 * Notion 适配器
 */
export class NotionAdapter extends BasePlatformAdapter {
  readonly id = 'notion';
  readonly name = 'Notion';
  readonly description = 'Notion 笔记和知识库，支持块级编辑和团队协作';

  private client: NotionClient | null = null;

  /**
   * 获取客户端
   */
  getClient(config?: NotionConfig): NotionClient {
    if (!this.client) {
      this.client = new NotionClient(config);
    } else if (config) {
      this.client.updateConfig(config);
    }
    return this.client;
  }

  /**
   * 转换 Markdown 为 Notion 格式
   * Notion 支持 API 创建块，这里返回解析后的 blocks 数据
   */
  async convert(markdown: string, _options?: ConvertOptions): Promise<string> {
    // 对于预览目的，返回格式化后的 Markdown
    return markdown;
  }

  /**
   * 是否支持直接发布
   */
  supportsDirectPublish(): boolean {
    return true;
  }

  /**
   * 发布到 Notion
   */
  async publish(
    content: string,
    options?: PublishOptions & {
      notionConfig?: NotionConfig;
      notionParentId?: string;
    }
  ): Promise<PublishResult> {
    const config = options?.notionConfig || {};
    const client = this.getClient(config);

    const title = options?.title || this.extractTitle(content);
    const parentId = options?.notionParentId || config.parentPageId;

    const result = await client.createPage(title, content, parentId);

    if (result.success) {
      return {
        success: true,
        url: result.url,
        message: '✅ 页面已创建到 Notion',
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  /**
   * 获取平台提示
   */
  getPlatformTips(): string[] {
    return [
      '需要在 Notion 中创建 Integration 并授予页面访问权限',
      '可以配置父页面 ID 或数据库 ID 来指定发布位置',
      'Markdown 会转换为 Notion 块（标题、列表、代码块等）',
      '代码块支持语法高亮',
    ];
  }

  /**
   * 获取平台说明文档链接
   */
  getDocsUrl(): string {
    return 'https://developers.notion.com/docs/create-a-notion-integration';
  }
}

/**
 * 创建 Notion 客户端
 */
export function createNotionClient(integrationToken: string): NotionClient {
  return new NotionClient({ integrationToken });
}
