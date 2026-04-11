/**
 * Platforms Module Entry Point
 */

import { WeChatAdapter } from './wechat';
import { FeishuAdapter } from './feishu';
import { NotionAdapter } from './notion';

export { BasePlatformAdapter } from './base';
export type {
  PlatformAdapter,
  ConvertOptions,
  PublishOptions,
  PublishResult,
} from './base';

export { WeChatMPClient, createWeChatMPClient, WeChatAdapter } from './wechat';
export type { WeChatMPConfig, DraftArticle, UploadImageResult } from './wechat';

export { FeishuAdapter, FeishuClient } from './feishu';
export type { FeishuConfig } from './feishu';

export { NotionAdapter, NotionClient, createNotionClient } from './notion';
export type { NotionConfig } from './notion';

/**
 * 获取所有可用平台
 */
export function getAvailablePlatforms() {
  return [
    new WeChatAdapter(),
    new FeishuAdapter(),
    new NotionAdapter(),
  ];
}

/**
 * 根据 ID 获取平台适配器
 */
export function getPlatformAdapter(platformId: string) {
  const platforms = getAvailablePlatforms();
  return platforms.find(p => p.id === platformId) || null;
}
