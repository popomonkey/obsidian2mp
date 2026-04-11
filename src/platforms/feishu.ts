/**
 * 飞书文档 (Feishu/Lark) 平台适配器
 * 将 Markdown 转换为飞书文档兼容的格式
 */

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
      const response = await fetch(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      });

      const data = await response.json();
      if (data.code === 0) {
        return data.tenant_access_token;
      }
      return null;
    } catch (error) {
      console.error('Failed to get Feishu access token:', error);
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
      // 创建云文档（Markdown 类型）
      const response = await fetch(`${this.baseUrl}/drive/v1/media/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          parent_type: 'folder',
          parent_token: folderToken || 'root',
          obj_type: 'docx',
          title: title,
        }),
      });

      const data = await response.json();
      if (data.code === 0) {
        const objectToken = data.file.token;
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
   * 更新文档内容
   */
  async updateDocumentContent(
    objectToken: string,
    content: string,
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 使用文档 API 更新内容
      const response = await fetch(
        `${this.baseUrl}/docx/v1/documents/${objectToken}/content/raw`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${accessToken}`,
          },
          body: content,
        }
      );

      const data = await response.json();
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

    const result = await client.createDocument(
      options?.title || 'Untitled',
      content,
      options?.folderToken
    );

    if (result.success) {
      return {
        success: true,
        url: result.objectUrl,
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
