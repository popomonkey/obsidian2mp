/**
 * 飞书文档 (Feishu/Lark) 平台适配器
 * 将 Markdown 转换为飞书文档兼容的格式
 */

import { requestUrl, RequestUrlParam } from 'obsidian';
import { BasePlatformAdapter } from './base';
import type { PlatformAdapter, ConvertOptions, PublishOptions, PublishResult } from './base';

/**
 * 飞书文档配置
 */
export interface FeishuConfig {
  appId?: string;
  appSecret?: string;
  tenantKey?: string;
  accessToken?: string;
}

/**
 * 飞书文档客户端
 */
export class FeishuClient {
  private config: FeishuConfig;
  private baseUrl = 'https://open.feishu.cn/open-apis';

  constructor(config: FeishuConfig = {}) {
    this.config = config;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string | null> {
    if (this.config.accessToken) {
      return this.config.accessToken;
    }

    if (!this.config.appId || !this.config.appSecret) {
      return null;
    }

    try {
      const resp = await requestUrl({
        url: `${this.baseUrl}/auth/v3/tenant_access_token/internal`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      });

      const data = resp.json;
      if (data.code === 0) {
        this.config.accessToken = data.tenant_access_token;
        return data.tenant_access_token;
      }
      console.error('[Feishu] 获取 token 失败:', data.msg);
      return null;
    } catch (error) {
      console.error('[Feishu] 获取 access token 失败:', error);
      return null;
    }
  }

  /**
   * 创建云文档
   */
  async createDocument(title: string, content: string, folderToken?: string): Promise<{
    success: boolean;
    objectToken?: string;
    objectUrl?: string;
    error?: string;
  }> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: '未配置飞书 API 凭证或获取令牌失败',
      };
    }

    try {
      // 使用文档 API 创建云文档
      const resp = await requestUrl({
        url: `${this.baseUrl}/doc/v1/documents`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          parent_node: folderToken || 'root',
          document: {
            title: title,
          },
        }),
      });

      const data = resp.json;
      if (data.code === 0) {
        const objectToken = data.data.document.object_token;
        const objectUrl = `https://feishu.cn/docx/${objectToken}`;

        // 更新文档内容
        await this.updateDocumentContent(objectToken, content, accessToken);

        return {
          success: true,
          objectToken,
          objectUrl,
        };
      }

      return {
        success: false,
        error: data.msg || '创建文档失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建文档失败',
      };
    }
  }

  /**
   * 更新文档内容 - 使用增量更新 API 添加 Markdown 内容
   */
  async updateDocumentContent(
    objectToken: string,
    markdownContent: string,
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 飞书文档使用块级 API，需要将 Markdown 转换为块结构
      const blocks = this.markdownToBlocks(markdownContent);

      // 批量添加块到文档
      const resp = await requestUrl({
        url: `${this.baseUrl}/doc/v1/documents/${objectToken}/blocks/children`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          children: blocks,
          direction: 'bottom',
        }),
      });

      const data = resp.json;
      if (data.code === 0) {
        return { success: true };
      }
      return {
        success: false,
        error: data.msg || '更新内容失败',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新内容失败',
      };
    }
  }

  /**
   * 将 Markdown 转换为飞书文档块结构
   */
  private markdownToBlocks(markdown: string): any[] {
    const blocks: any[] = [];
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 代码块
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim() || 'markdown';
          codeLines = [];
        } else {
          inCodeBlock = false;
          blocks.push({
            block_type: 2, // 代码块
            code: {
              language: this.mapLanguage(codeLanguage),
              rich_text: [{
                text: { content: codeLines.join('\n') },
              }],
            },
          });
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // 标题处理
      if (line.startsWith('#### ')) {
        blocks.push(this.createHeadingBlock(4, line.slice(5)));
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push(this.createHeadingBlock(3, line.slice(4)));
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(this.createHeadingBlock(2, line.slice(3)));
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push(this.createHeadingBlock(1, line.slice(2)));
        continue;
      }

      // 有序列表
      if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, '');
        blocks.push({
          block_type: 2,
          numbered_list_item: {
            rich_text: this.parseInlineContent(content),
          },
        });
        continue;
      }

      // 无序列表
      if (/^[-*+]\s/.test(line)) {
        const content = line.replace(/^[-*+]\s/, '');
        blocks.push({
          block_type: 3,
          bullet: {
            rich_text: this.parseInlineContent(content),
          },
        });
        continue;
      }

      // 引用
      if (line.startsWith('> ')) {
        blocks.push({
          block_type: 2,
          quote: {
            rich_text: this.parseInlineContent(line.slice(2)),
          },
        });
        continue;
      }

      // 分隔线
      if (line === '---' || line === '***' || line === '---') {
        blocks.push({
          block_type: 2,
          divider: {},
        });
        continue;
      }

      // 空行
      if (line.trim() === '') {
        continue;
      }

      // 普通段落
      blocks.push({
        block_type: 2,
        paragraph: {
          rich_text: this.parseInlineContent(line),
        },
      });
    }

    return blocks;
  }

  /**
   * 创建标题块
   */
  private createHeadingBlock(level: number, text: string): any {
    const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const tag = headingTags[level - 1] || 'h1';

    return {
      block_type: 2,
      [tag]: {
        rich_text: this.parseInlineContent(text),
      },
    };
  }

  /**
   * 解析行内 Markdown（粗体、斜体、链接、代码等）
   */
  private parseInlineContent(text: string): any[] {
    const parts: any[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      // 粗体 **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push({
          text: { content: boldMatch[1] },
          annotations: { bold: true },
        });
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // 斜体 *text* (但不是 **)
      const italicMatch = remaining.match(/^\*(?!\*)(.+?)\*/);
      if (italicMatch) {
        parts.push({
          text: { content: italicMatch[1] },
          annotations: { italic: true },
        });
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // 行内代码 `code`
      const codeMatch = remaining.match(/^`(.+?)`/);
      if (codeMatch) {
        parts.push({
          text: { content: codeMatch[1] },
          annotations: { code: true },
        });
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // 链接 [text](url)
      const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
      if (linkMatch) {
        parts.push({
          text: { content: linkMatch[1], link: { url: linkMatch[2] } },
        });
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // 普通文本 - 找到下一个标记的位置
      const nextMarkIndex = [
        remaining.indexOf('**'),
        remaining.indexOf('*'),
        remaining.indexOf('`'),
        remaining.indexOf('['),
      ].filter((idx) => idx !== -1);

      if (nextMarkIndex.length === 0) {
        // 没有更多标记，添加剩余所有文本
        parts.push({ text: { content: remaining } });
        break;
      }

      const minIndex = Math.min(...nextMarkIndex);
      if (minIndex === 0) {
        // 标记在开头但未匹配，跳过第一个字符
        parts.push({ text: { content: remaining[0] } });
        remaining = remaining.slice(1);
      } else {
        parts.push({ text: { content: remaining.slice(0, minIndex) } });
        remaining = remaining.slice(minIndex);
      }
    }

    return parts.length > 0 ? parts : [{ text: { content: text } }];
  }

  /**
   * 映射编程语言
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
   * 更新配置
   */
  updateConfig(config: Partial<FeishuConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查配置是否完整
   */
  isConfigured(): boolean {
    return !!(this.config.appId && this.config.appSecret);
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<string | null> {
    if (!this.config.appId || !this.config.appSecret) {
      return '请先配置 AppID 和 AppSecret';
    }

    try {
      const token = await this.getAccessToken();
      return token ? null : '获取 access token 失败';
    } catch (error) {
      return error instanceof Error ? error.message : '连接测试失败';
    }
  }
}

/**
 * 飞书文档适配器
 */
export class FeishuAdapter extends BasePlatformAdapter implements PlatformAdapter {
  readonly id = 'feishu';
  readonly name = '飞书文档';
  readonly description = '飞书云文档，支持 Markdown 格式和团队协作';

  private client: FeishuClient | null = null;

  /**
   * 获取客户端
   */
  getClient(config?: FeishuConfig): FeishuClient {
    if (!this.client) {
      this.client = new FeishuClient(config);
    } else if (config) {
      this.client.updateConfig(config);
    }
    return this.client;
  }

  /**
   * 转换 Markdown 为飞书文档格式
   * 飞书文档支持 Markdown，直接返回即可
   */
  async convert(markdown: string, _options?: ConvertOptions): Promise<string> {
    // 飞书文档原生支持 Markdown，直接返回
    return markdown;
  }

  /**
   * 是否支持直接发布
   */
  supportsDirectPublish(): boolean {
    return true;
  }

  /**
   * 发布到飞书文档
   */
  async publish(
    content: string,
    options?: PublishOptions & {
      folderToken?: string;
      feishuConfig?: FeishuConfig;
    }
  ): Promise<PublishResult> {
    const client = this.getClient(options?.feishuConfig);

    // 提取标题（从 Markdown 中提取 # 标题）
    const title = this.extractTitle(content);

    const result = await client.createDocument(
      title,
      content,
      options?.folderToken
    );

    if (result.success) {
      return {
        success: true,
        url: result.objectUrl,
        message: '✅ 飞书文档已创建：' + result.objectUrl,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  /**
   * 获取平台提示信息
   */
  getPlatformTip(): string {
    return '💡 飞书文档：支持 API 直接创建云文档，也可复制 Markdown 后粘贴到飞书编辑器';
  }

  /**
   * 获取平台说明文档链接
   */
  getDocsUrl(): string {
    return 'https://open.feishu.cn/document/server-docs/docs/drive-v1/overview';
  }
}
