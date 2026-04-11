import { Plugin, Notice, Editor, MarkdownView, WorkspaceSidedock } from "obsidian";
import { Obsidian2MPSettingTab, Obsidian2MPSettings } from "./settings";
import { markdownToWeChatHTML, getTheme } from "./converter";
import { PreviewModal } from "./ui/preview-modal";
import { WeChatMPClient } from "./platforms";

/**
 * Obsidian2MP Plugin
 * Push Obsidian notes to WeChat Official Account (公众号)
 */
export default class Obsidian2MPPlugin extends Plugin {
  settings: Obsidian2MPSettings;

  async onload() {
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new Obsidian2MPSettingTab(this.app, this));

    // Add ribbon icon - 使用有效的内置图标
    this.addRibbonIcon("paper-plane", "Obsidian2MP: 推送到公众号", () => {
      this.openPreview();
    });

    // Add command palette command - open preview
    this.addCommand({
      id: "preview-note-to-wechat-mp",
      name: "Preview: Push current note to WeChat MP",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.openPreview();
      },
      callback: () => {
        this.openPreview();
      }
    });

    // Add command - quick push (no preview)
    this.addCommand({
      id: "push-current-note-to-wechat-mp",
      name: "Quick Push: Convert and copy HTML",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.pushToWeChatMP();
      },
      callback: () => {
        this.pushToWeChatMP();
      }
    });

    // Add command - publish to WeChat draft (using API)
    this.addCommand({
      id: "publish-to-wechat-draft",
      name: "Publish: Create WeChat Draft (API)",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.publishToWeChatDraft();
      },
      callback: () => {
        this.publishToWeChatDraft();
      }
    });
  }

  /**
   * Open plugin settings tab
   */
  private openPluginSettings(): void {
    // @ts-ignore - Internal Obsidian API
    this.app.setting.open();
    // @ts-ignore - Internal Obsidian API
    this.app.setting.openTabById('obsidian2mp');
  }

  onunload() {
    // Cleanup if needed
  }

  /**
   * Open preview modal
   */
  async openPreview() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("Please open a note first");
      return;
    }

    const markdown = view.editor.getValue();

    // 准备平台配置
    const wechatConfig = this.settings.wechatAppId && this.settings.wechatAppSecret
      ? {
          appId: this.settings.wechatAppId,
          appSecret: this.settings.wechatAppSecret,
          accessToken: this.settings.wechatAccessToken,
          app: this.app, // 传递 app 实例用于 requestUrl
        }
      : undefined;

    const feishuConfig = this.settings.feishuAppId && this.settings.feishuAppSecret
      ? {
          appId: this.settings.feishuAppId,
          appSecret: this.settings.feishuAppSecret,
        }
      : undefined;

    const notionConfig = this.settings.notionIntegrationToken
      ? {
          integrationToken: this.settings.notionIntegrationToken,
          databaseId: this.settings.notionDatabaseId,
          parentPageId: this.settings.notionParentPageId,
        }
      : undefined;

    const modal = new PreviewModal(this.app, markdown, wechatConfig, feishuConfig, notionConfig);
    modal.open();
  }

  /**
   * Main function: Push current note to WeChat MP (quick mode)
   */
  async pushToWeChatMP() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("Please open a note first");
      return;
    }

    const markdown = view.editor.getValue();

    try {
      // Get theme from settings
      const theme = getTheme(this.settings.defaultTheme);

      // Convert markdown to HTML
      const html = markdownToWeChatHTML(markdown, theme);

      // Copy to clipboard
      await navigator.clipboard.writeText(html);
      new Notice("✅ HTML copied to clipboard! Paste it in WeChat MP editor");
    } catch (error) {
      console.error("Push to WeChat MP failed:", error);
      new Notice("Failed to push to WeChat MP. Check console for details.");
    }
  }

  /**
   * Publish current note to WeChat draft via API
   * 使用微信公众号 API 直接创建草稿
   */
  async publishToWeChatDraft() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("Please open a note first");
      return;
    }

    // 检查配置
    if (!this.settings.wechatAppId || !this.settings.wechatAppSecret) {
      new Notice("Please configure WeChat AppID and AppSecret in settings first");
      this.openPluginSettings();
      return;
    }

    const markdown = view.editor.getValue();
    const file = view.file;

    if (!file) {
      new Notice("Unable to get current file");
      return;
    }

    // 提取 frontmatter 中的封面配置
    const cache = this.app.metadataCache.getFileCache(file);
    let coverMediaId: string | undefined;

    if (cache?.frontmatter) {
      // 优先使用 thumb_media_id（微信公众号素材库中的 media_id）
      coverMediaId = cache.frontmatter['thumb_media_id'];

      // 如果没有 thumb_media_id，检查 banner（本地路径或网络 URL）
      if (!coverMediaId && cache.frontmatter['banner']) {
        // TODO: 上传本地图片到微信素材库
        new Notice("📷 检测到 banner 配置，请先在微信公众号后台手动上传封面图片，并设置 thumb_media_id");
        return;
      }
    }

    // 如果没有封面，提示用户
    if (!coverMediaId) {
      new Notice("❌ 请在笔记 frontmatter 中设置 thumb_media_id 字段值为微信公众号素材的 media_id\n\n示例：\n---\ntitle: 文章标题\nthumb_media_id: xxx123abc\n---");
      return;
    }

    try {
      // 获取主题
      const theme = getTheme(this.settings.defaultTheme);

      // 转换为 HTML
      const html = markdownToWeChatHTML(markdown, theme);

      // 提取标题和摘要
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : view.file?.basename || '无标题';

      // 提取摘要（第一段）
      const lines = markdown.split('\n');
      let digest = '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('!')) {
          digest = trimmed.slice(0, 120);
          break;
        }
      }

      // 创建微信公众号客户端
      const wechatClient = new WeChatMPClient({
        appId: this.settings.wechatAppId,
        appSecret: this.settings.wechatAppSecret,
        accessToken: this.settings.wechatAccessToken,
        app: this.app,
      });

      new Notice("Creating draft in WeChat MP...");

      // 创建草稿
      const result = await wechatClient.createDraft({
        title,
        content: html,
        digest,
        author: '',
        coverMediaId: coverMediaId, // 传入封面 media_id
        showCover: true,
      });

      new Notice(`✅ Draft created! Media ID: ${result.mediaId}`);

      // 可选：打开草稿链接
      const { shell } = require('electron');
      shell.openExternal(result.url);

    } catch (error) {
      console.error("Publish to WeChat draft failed:", error);
      new Notice(`Failed to create draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, await this.loadData());
    // Ensure new settings exist for existing users
    this.settings.defaultTheme = this.settings.defaultTheme || 'tech-blue';
    this.settings.defaultPlatform = this.settings.defaultPlatform || 'wechat';
    this.settings.previewSize = this.settings.previewSize || 'medium';
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}