/**
 * WeChat MP (微信公众号) API Client
 * 基于官方插件 obsidian-wechat-public-platform 的实现
 * 使用 requestUrl 解决 CORS 问题
 */

import { App, Notice, requestUrl, RequestUrlParam, TFile } from 'obsidian';
import { BasePlatformAdapter } from './base';
import type { ConvertOptions, PublishOptions, PublishResult } from './base';

export interface WeChatMPConfig {
  appId: string;
  appSecret: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  app?: App; // Obsidian app 实例，用于 requestUrl
}

export interface DraftArticle {
  title: string;
  content: string;
  coverMediaId?: string;
  digest?: string;
  author?: string;
  showCover?: boolean;
}

export interface UploadImageResult {
  mediaId: string;
  url: string;
}

/**
 * 微信公众号 API 客户端
 */
export class WeChatMPClient {
  private config: WeChatMPConfig;
  private app: App | undefined;
  private baseUrl = 'https://api.weixin.qq.com';
  private expireDuration = 7200; // token 有效期 2 小时

  constructor(config: WeChatMPConfig, app?: App) {
    this.config = config;
    this.app = config.app || app;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WeChatMPConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 检查配置是否完整
   */
  isConfigured(): boolean {
    return !!this.config.appId && !!this.config.appSecret;
  }

  /**
   * 使用 requestUrl 发起请求（解决 CORS 问题）
   */
  private async request(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
    const url = `${this.baseUrl}${path}?access_token=${accessToken}`;

    const reqOptions: RequestUrlParam = {
      url,
      method,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      reqOptions.body = JSON.stringify(body);
    }

    try {
      const response = await requestUrl(reqOptions);

      if (response.json.errcode && response.json.errcode !== 0) {
        throw new Error(`API 错误 ${response.json.errcode}: ${response.json.errmsg}`);
      }

      return response.json;
    } catch (error) {
      console.error('[WeChat API 请求失败]:', error);
      throw error;
    }
  }

  /**
   * 获取 Access Token
   * 优先使用缓存的 token，过期后再重新获取
   */
  async getAccessToken(): Promise<string> {
    // 检查是否有有效的缓存 token
    if (this.config.accessToken && this.config.tokenExpiresAt) {
      const now = Date.now();
      // 提前 5 分钟刷新
      if (now < this.config.tokenExpiresAt - 5 * 60 * 1000) {
        return this.config.accessToken;
      }
    }

    // 需要重新获取 token
    const url = `${this.baseUrl}/cgi-bin/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`;

    try {
      const resp = await requestUrl({
        url,
        method: 'GET',
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      const data = resp.json;

      if (data.errcode) {
        throw new Error(`获取 Access Token 失败：${data.errmsg} (错误码: ${data.errcode})`);
      }

      const accessToken = data.access_token;
      const expiresIn = data.expires_in || this.expireDuration;

      // 更新配置
      this.config.accessToken = accessToken;
      this.config.tokenExpiresAt = Date.now() + expiresIn * 1000;

      return accessToken;
    } catch (error) {
      console.error('[WeChat] 获取 Access Token 失败:', error);
      throw new Error(`获取 Access Token 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 手动设置 Access Token
   */
  setAccessToken(token: string, expiresIn: number = 7200): void {
    this.config.accessToken = token;
    this.config.tokenExpiresAt = Date.now() + expiresIn * 1000;
  }

  /**
   * 创建草稿文章
   * https://developers.weixin.qq.com/doc/offiaccount/Draft_Box/Add_draft.html
   */
  async createDraft(article: DraftArticle): Promise<{ mediaId: string; url: string }> {
    const articles = [{
      title: article.title,
      author: article.author || '',
      digest: article.digest || '',
      content: article.content,
      content_source_url: '',
      thumb_media_id: article.coverMediaId || '',
      show_cover_pic: article.showCover !== false ? 1 : 0,
      need_open_comment: 0,
      only_fans_can_comment: 0,
    }];

    console.log('[WeChat] 创建草稿, 标题:', article.title);

    const data = await this.request('/cgi-bin/draft/add', 'POST', { articles });

    console.log('[WeChat] 创建草稿响应:', data);

    if (data.errcode && data.errcode !== 0) {
      throw new Error(`创建草稿失败：${data.errmsg}`);
    }

    return {
      mediaId: data.media_id,
      // 预览 URL 需要从微信后台获取，这里返回的只是占位符
      url: `https://mp.weixin.qq.com/cgi-bin/draft?action=edit&media_id=${data.media_id}`,
    };
  }

  /**
   * 更新草稿文章
   */
  async updateDraft(mediaId: string, article: DraftArticle, index: number = 0): Promise<void> {
    const articles = [{
      title: article.title,
      author: article.author || '',
      digest: article.digest || '',
      content: article.content,
      content_source_url: '',
      thumb_media_id: article.coverMediaId || '',
      show_cover_pic: article.showCover !== false ? 1 : 0,
    }];

    await this.request('/cgi-bin/draft/update', 'POST', {
      media_id: mediaId,
      index,
      articles,
    });
  }

  /**
   * 删除草稿
   */
  async deleteDraft(mediaId: string): Promise<void> {
    await this.request('/cgi-bin/draft/delete', 'POST', { media_id: mediaId });
  }

  /**
   * 获取草稿
   */
  async getDraft(mediaId: string): Promise<any> {
    return await this.request('/cgi-bin/draft/get', 'POST', { media_id: mediaId });
  }

  /**
   * 上传永久素材（封面图）
   * https://developers.weixin.qq.com/doc/offiaccount/Asset_Management/Adding_Permanent_Artworks.html
   */
  async uploadImageFromLocal(filePath: string, fileName: string): Promise<UploadImageResult> {
    const accessToken = await this.getAccessToken();
    const url = `${this.baseUrl}/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;

    // 获取 App 实例
    const app = this.app;
    if (!app) {
      throw new Error('缺少 App 实例，无法读取本地文件');
    }

    // 获取文件数据
    const vault = app.vault;
    const abstractFile = vault.getAbstractFileByPath(filePath);

    if (!abstractFile || !(abstractFile instanceof TFile)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const file = abstractFile as TFile;

    // 读取文件内容为 ArrayBuffer
    const arrayBuffer = await vault.readBinary(file);
    const uint8Array = new Uint8Array(arrayBuffer);

    // 获取文件扩展名
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    // 构建 FormData (使用 boundary)
    const boundary = '------WeChatMPFormBoundary' + Date.now();
    const endBoundary = '\r\n--' + boundary + '--\r\n';

    let formDataString = `--${boundary}\r\n`;
    formDataString += `Content-Disposition: form-data; name="media"; filename="${fileName}"\r\n`;
    formDataString += `Content-Type: ${contentType}\r\n\r\n`;

    const formBuffer = Buffer.from(formDataString, 'utf-8');
    const endBuffer = Buffer.from(endBoundary, 'utf-8');

    const postArray = [...Array.from(formBuffer), ...Array.from(uint8Array), ...Array.from(endBuffer)];
    const postBuffer = Buffer.from(postArray);
    // 转换为 ArrayBuffer
    const bodyArrayBuffer = postBuffer.buffer.slice(postBuffer.byteOffset, postBuffer.byteOffset + postBuffer.byteLength);

    const resp = await requestUrl({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
      },
      body: bodyArrayBuffer,
    });

    // 检查错误码
    if (resp.json.errcode) {
      // 40007: invalid media_id, 40007 可能是图片已存在的情况
      // 错误信息: "File already exists" 表示图片已上传过
      if (resp.json.errcode === 40007 || resp.json.errmsg?.includes('File already exists')) {
        throw new Error('该封面图片已经上传过，请更换一张图片或使用不同的图片文件');
      }
      throw new Error(`上传封面图失败：${resp.json.errmsg}`);
    }

    return {
      mediaId: resp.json.media_id,
      url: resp.json.url,
    };
  }

  /**
   * 获取永久素材列表
   */
  async getMaterialList(type: string = 'image', offset: number = 0, count: number = 20): Promise<any> {
    return await this.request('/cgi-bin/material/batchget_material', 'POST', {
      type,
      offset,
      count,
    });
  }

  /**
   * 从网络URL上传图片
   */
  async uploadImageFromUrl(imageUrl: string): Promise<UploadImageResult> {
    const accessToken = await this.getAccessToken();
    const url = `${this.baseUrl}/cgi-bin/media/uploadimg?access_token=${accessToken}`;

    // 下载图片
    const imgResp = await requestUrl(imageUrl);
    const blobBytes = imgResp.arrayBuffer;

    // 构建 FormData
    const boundary = '------WeChatMPFormBoundary' + Date.now();
    const endBoundary = '\r\n--' + boundary + '--\r\n';

    let formDataString = `--${boundary}\r\n`;
    formDataString += 'Content-Disposition: form-data; name="media"; filename="image.jpg"\r\n';
    formDataString += 'Content-Type: image/jpeg\r\n\r\n';

    const formBuffer = Buffer.from(formDataString, 'utf-8');
    const endBuffer = Buffer.from(endBoundary, 'utf-8');

    const picArray = new Uint8Array(blobBytes);
    const postArray = [...Array.from(formBuffer), ...Array.from(picArray), ...Array.from(endBuffer)];
    const postBuffer = Buffer.from(postArray);
    // 转换为 ArrayBuffer
    const bodyArrayBuffer = postBuffer.buffer.slice(postBuffer.byteOffset, postBuffer.byteOffset + postBuffer.byteLength);

    const resp = await requestUrl({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
      },
      body: bodyArrayBuffer,
    });

    if (resp.json.errcode && resp.json.errcode !== 0) {
      throw new Error(`上传图片失败：${resp.json.errmsg}`);
    }

    return {
      mediaId: resp.json.media_id,
      url: resp.json.url,
    };
  }

  /**
   * 检查服务器状态
   */
  async checkServerStatus(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('WeChat MP API 检查失败:', error);
      return false;
    }
  }

  /**
   * 测试 API 连接性（用于设置界面）
   * 返回错误信息，如果有错误的话
   */
  async testConnection(): Promise<string | null> {
    if (!this.config.appId || !this.config.appSecret) {
      return '请先配置 AppID 和 AppSecret';
    }

    try {
      await this.getAccessToken();
      return null; // 成功返回 null
    } catch (error) {
      return error instanceof Error ? error.message : '连接测试失败';
    }
  }
}

/**
 * 微信公众号适配器
 */
export class WeChatAdapter extends BasePlatformAdapter {
  readonly id = 'wechat';
  readonly name = '微信公众号';
  readonly description = '中国最大的社交平台，适合图文推送';

  private client: WeChatMPClient | null = null;
  private app: App | undefined;

  /**
   * 设置 App 实例
   */
  setApp(app: App): void {
    this.app = app;
    if (this.client) {
      this.client.updateConfig({ app });
    }
  }

  /**
   * 获取客户端
   */
  getClient(config?: WeChatMPConfig): WeChatMPClient {
    if (!this.client) {
      this.client = new WeChatMPClient(config || { appId: '', appSecret: '' }, this.app);
    } else if (config) {
      this.client.updateConfig(config);
    }
    return this.client;
  }

  /**
   * 转换 Markdown 为微信公众号 HTML 格式
   */
  async convert(markdown: string, _options?: ConvertOptions): Promise<string> {
    // 这里应该调用 markdownToWeChatHTML
    // 为了简单起见，直接返回 markdown
    return markdown;
  }

  /**
   * 是否支持直接发布
   */
  supportsDirectPublish(): boolean {
    return true;
  }

  /**
   * 发布到微信公众号
   */
  async publish(content: string, options?: PublishOptions): Promise<PublishResult> {
    const config = options?.wechatConfig;
    if (!config || !config.appId || !config.appSecret) {
      return {
        success: false,
        error: '未配置微信公众号 AppID 或 AppSecret',
      };
    }

    try {
      const client = this.getClient(config);

      // 如果有手动传入 accessToken
      if (config.accessToken) {
        client.setAccessToken(config.accessToken);
      }

      // 提取标题和摘要
      const title = options?.title || this.extractTitle(content);
      const digest = options?.digest || this.extractDigest(content);

      // 创建草稿（带封面图）
      const result = await client.createDraft({
        title,
        content,
        digest,
        author: options?.author,
        coverMediaId: options?.coverImage,
        showCover: !!options?.coverImage,
      });

      return {
        success: true,
        articleId: result.mediaId,
        url: result.url,
        message: '✅ 草稿已创建！点击链接前往公众号后台编辑和发布',
      };
    } catch (error) {
      console.error('[WeChat] 发布失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '发布失败',
      };
    }
  }

  /**
   * 获取发布提示
   */
  getPublishingTips(): string[] {
    return [
      '微信公众号需要配置 AppID 和 AppSecret',
      '创建草稿后需前往公众号后台发布',
      '图片建议宽度为 640px',
      '摘要建议控制在 50 字以内',
    ];
  }
}

/**
 * 创建微信公众号客户端
 */
export function createWeChatMPClient(appId: string, appSecret: string, app?: App): WeChatMPClient {
  return new WeChatMPClient({ appId, appSecret }, app);
}