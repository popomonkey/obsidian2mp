/**
 * Platform Adapter Base
 * 平台适配器基类
 */

export interface PlatformAdapter {
  /**
   * 平台标识
   */
  id: string;

  /**
   * 平台名称
   */
  name: string;

  /**
   * 平台描述
   */
  description: string;

  /**
   * 是否支持直接发布
   */
  supportsDirectPublish(): boolean;

  /**
   * 将 Markdown 转换为目标平台格式
   */
  convert(markdown: string, options?: ConvertOptions): Promise<string>;

  /**
   * 直接发布（如果支持）
   */
  publish?(content: string, options?: PublishOptions): Promise<PublishResult>;
}

export interface ConvertOptions {
  /**
   * 是否保留原始格式
   */
  preserveOriginal?: boolean;

  /**
   * 是否添加平台特定样式
   */
  addPlatformStyles?: boolean;

  /**
   * 目标风格
   */
  style?: 'default' | 'tech' | 'casual' | 'academic';
}

export interface PublishOptions {
  title: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  // 微信公众号特定选项
  author?: string;
  digest?: string;
  // 飞书特定选项
  folderToken?: string;
  // Notion 特定选项
  notionParentId?: string;
  // 平台配置
  wechatConfig?: { appId: string; appSecret: string; accessToken?: string };
  feishuConfig?: { appId: string; appSecret: string; accessToken?: string };
  notionConfig?: { integrationToken?: string; databaseId?: string; parentPageId?: string };
}

export interface PublishResult {
  success: boolean;
  articleId?: string;
  url?: string;
  error?: string;
  message?: string;
}

/**
 * 基础平台适配器
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;

  supportsDirectPublish(): boolean {
    return false;
  }

  abstract convert(markdown: string, options?: ConvertOptions): Promise<string>;

  async publish?(content: string, options?: PublishOptions): Promise<PublishResult> {
    throw new Error('Direct publishing is not supported for this platform');
  }

  /**
   * 提取 Markdown 标题
   */
  protected extractTitle(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '无标题';
  }

  /**
   * 提取 Markdown 摘要（第一段）
   */
  protected extractDigest(markdown: string): string {
    const lines = markdown.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!')) {
        return trimmed.slice(0, 200);
      }
    }
    return '';
  }

  /**
   * 提取或生成标签
   */
  protected extractTags(markdown: string, maxTags: number = 5): string[] {
    // 尝试从 frontmatter 提取
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.+?)\]/);
      if (tagsMatch) {
        return tagsMatch[1].split(',').map(t => t.trim()).slice(0, maxTags);
      }
    }

    // 从内容中提取常见技术标签
    const commonTags: Record<string, RegExp> = {
      'JavaScript': /\b(js|javascript|node\.js|nodejs)\b/i,
      'TypeScript': /\b(ts|typescript)\b/i,
      'Python': /\bpython\b/i,
      'React': /\breact\b/i,
      'Vue': /\bvue\b/i,
      '前端': /\b(前端|frontend|html|css)\b/i,
      '后端': /\b(后端|backend|server)\b/i,
    };

    const tags: string[] = [];
    for (const [tag, regex] of Object.entries(commonTags)) {
      if (regex.test(markdown) && tags.length < maxTags) {
        tags.push(tag);
      }
    }

    return tags;
  }
}
