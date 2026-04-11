/**
 * Preview Modal for Multi-Platform Publishing
 * 预览窗口：支持多平台切换、主题切换和实时预览
 */

import { App, Modal, Setting, MarkdownView, Notice, TFile, TFolder, normalizePath } from 'obsidian';
import { markdownToWeChatHTML, getTheme, getAllThemes, WeChatTheme } from '../converter';
import { getPlatformAdapter, WeChatMPClient } from '../platforms';
import type { PublishOptions } from '../platforms';
import { openMaterialLibraryModal, MaterialImage } from './material-library-modal';

export type PlatformType = 'wechat' | 'feishu' | 'notion';

export class PreviewModal extends Modal {
  private markdown: string;
  private currentTheme: WeChatTheme;
  private currentPlatform: PlatformType;
  private previewContainer: HTMLElement | null = null;
  private themeButtons: Map<string, HTMLElement> = new Map();
  private wechatConfig?: { appId: string; appSecret: string; accessToken?: string };
  private feishuConfig?: { appId: string; appSecret: string };
  private notionConfig?: { integrationToken?: string; databaseId?: string; parentPageId?: string };
  // 封面图相关
  private coverFilePath: string = '';
  private coverMediaId: string = '';
  private coverSource: 'local' | 'library' = 'local';
  private coverLibraryUrl: string = ''; // 素材库图片的 URL 用于预览
  private coverPreviewEl: HTMLElement | null = null;
  private coverUploadBtn: HTMLButtonElement | null = null;
  private coverLibraryBtn: HTMLButtonElement | null = null;

  constructor(app: App, markdown: string,
    wechatConfig?: { appId: string; appSecret: string; accessToken?: string },
    feishuConfig?: { appId: string; appSecret: string },
    notionConfig?: { integrationToken?: string; databaseId?: string; parentPageId?: string }) {
    super(app);
    this.markdown = markdown;
    this.currentTheme = getTheme('tech-blue');
    this.currentPlatform = 'wechat';
    this.wechatConfig = wechatConfig;
    this.feishuConfig = feishuConfig;
    this.notionConfig = notionConfig;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    // 设置窗口标题
    this.setTitle('预览 - 多平台发布');

    // 创建预览区域
    this.createPreviewArea(contentEl);

    // 创建控制区域
    this.createControlArea(contentEl);

    // 初始渲染
    this.renderPreview();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.previewContainer = null;
    this.themeButtons.clear();
  }

  /**
   * 创建预览区域
   */
  private createPreviewArea(contentEl: HTMLElement) {
    const previewWrapper = contentEl.createDiv('preview-wrapper');

    previewWrapper.style.cssText = `
      max-height: 60vh;
      overflow-y: auto;
      border: 1px solid var(--background-modifier-border);
      border-radius: 8px;
      margin: 16px 0;
      padding: 20px;
      background: var(--background-primary);
    `;

    this.previewContainer = previewWrapper.createDiv('preview-content');
  }

  /**
   * 创建控制区域
   */
  private createControlArea(contentEl: HTMLElement) {
    // 平台选择
    const platformSetting = new Setting(contentEl)
      .setName('发布平台')
      .setDesc('选择目标发布平台')
      .addDropdown(dropdown => {
        dropdown
          .addOption('wechat', '微信公众号 - 带样式 HTML')
          .addOption('feishu', '飞书文档 - Markdown')
          .addOption('notion', 'Notion - 知识库/笔记')
          .setValue(this.currentPlatform)
          .onChange((value) => {
            this.currentPlatform = value as PlatformType;
            this.renderPreview();
          });
      });

    // 主题选择（仅微信公众号需要）
    const themeSetting = new Setting(contentEl)
      .setName('主题样式')
      .setDesc('选择文章排版主题（仅微信公众号）');

    const themeContainer = themeSetting.settingEl.createDiv('theme-buttons');

    themeContainer.style.cssText = `
      display: flex;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
    `;

    const themes = getAllThemes();
    themes.forEach(theme => {
      const button = themeContainer.createEl('button', {
        text: theme.name,
      });

      button.style.cssText = `
        padding: 8px 16px;
        border: 2px solid ${theme.id === this.currentTheme.id ? theme.colors.primary : 'var(--background-modifier-border)'};
        border-radius: 6px;
        background: ${theme.id === this.currentTheme.id ? theme.colors.primary + '20' : 'var(--background-primary)'};
        color: var(--text-normal);
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
      `;

      button.addEventListener('click', () => {
        this.currentTheme = theme;
        this.updateThemeButtons();
        this.renderPreview();
      });

      this.themeButtons.set(theme.id, button);
    });

    // 封面图片上传（仅微信公众号）
    const coverSetting = new Setting(contentEl)
      .setName('封面图片')
      .setDesc('上传封面图片（仅微信公众号，需要配置 AppID 和 AppSecret）');

    const coverContainer = coverSetting.settingEl.createDiv('cover-upload-container');
    coverContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    `;

    // 按钮组
    const buttonGroup = coverContainer.createDiv('cover-buttons');
    buttonGroup.style.cssText = `
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    `;

    // 本地上传按钮
    this.coverUploadBtn = buttonGroup.createEl('button', {
      text: this.coverFilePath ? '更换本地图片' : '📁 选择本地图片',
    });
    this.coverUploadBtn.style.cssText = `
      padding: 8px 16px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    this.coverUploadBtn.addEventListener('click', () => this.selectCoverImage());

    // 素材库按钮
    this.coverLibraryBtn = buttonGroup.createEl('button', {
      text: this.coverMediaId && this.coverSource === 'library' ? '更换素材库图片' : '🖼️ 选择素材库图片',
    });
    this.coverLibraryBtn.style.cssText = `
      padding: 8px 16px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    this.coverLibraryBtn.addEventListener('click', () => this.selectFromMaterialLibrary());

    // 封面预览
    const previewWrapper = coverContainer.createDiv('cover-preview-wrapper');
    previewWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 16px;
    `;

    // 封面预览图
    this.coverPreviewEl = previewWrapper.createDiv('cover-preview');
    this.coverPreviewEl.style.cssText = `
      width: 120px;
      height: 68px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--background-secondary);
      position: relative;
    `;

    // 来源标签
    const sourceTag = previewWrapper.createDiv('cover-source-tag');
    sourceTag.style.cssText = `
      font-size: 12px;
      color: var(--text-muted);
      padding: 4px 8px;
      background: var(--background-secondary);
      border-radius: 4px;
    `;
    sourceTag.id = 'cover-source-tag';
    sourceTag.textContent = this.coverMediaId ? (this.coverSource === 'local' ? '📁 本地图片' : '🖼️ 素材库') : '未设置封面';
    sourceTag.style.display = this.coverMediaId ? 'block' : 'none';

    // 清除按钮
    const clearBtn = previewWrapper.createEl('button', { text: '清除' });
    clearBtn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      background: var(--background-primary);
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
    `;
    clearBtn.addEventListener('click', () => this.clearCoverImage());

    // 字号选择（仅微信公众号需要）
    const fontSizeSetting = new Setting(contentEl)
      .setName('正文字号')
      .setDesc('调整正文字体大小（仅微信公众号）')
      .addDropdown(dropdown => {
        dropdown
          .addOption('14', '14px - 紧凑')
          .addOption('15', '15px - 标准')
          .addOption('16', '16px - 舒适')
          .setValue('15')
          .onChange(async (value) => {
            if (this.previewContainer) {
              this.previewContainer.style.fontSize = `${value}px`;
            }
          });
      });

    // 平台提示信息
    const tipContainer = contentEl.createDiv('platform-tips');
    tipContainer.style.cssText = `
      padding: 12px 16px;
      margin: 12px 0;
      border-radius: 6px;
      background: var(--background-secondary);
      font-size: 13px;
      color: var(--text-muted);
    `;
    tipContainer.id = 'platform-tips';
    this.updatePlatformTips(tipContainer);

    // 一键发布配置提示
    const publishTipContainer = contentEl.createDiv('publish-tip-container');
    publishTipContainer.style.cssText = `
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 6px;
      background: var(--background-modifier-info);
      font-size: 13px;
      color: var(--text-normal);
    `;
    publishTipContainer.id = 'publish-tip';
    this.updatePublishTip(publishTipContainer);

    // 操作按钮
    const actionSetting = new Setting(contentEl);
    actionSetting.settingEl.style.cssText = 'margin-top: 20px; justify-content: center; gap: 8px;';

    // 一键发布按钮
    actionSetting.addButton(button => {
      button
        .setButtonText('一键发布')
        .setCta()
        .setTooltip('发布到所有已配置的平台')
        .onClick(() => this.publishToAllPlatforms());
    });

    // 复制按钮
    actionSetting.addButton(button => {
      button
        .setButtonText('复制')
        .onClick(() => this.copyContent());
    });

    // 取消按钮
    actionSetting.addButton(button => {
      button
        .setButtonText('取消')
        .onClick(() => this.close());
    });
  }

  /**
   * 更新一键发布提示
   */
  private updatePublishTip(container: HTMLElement) {
    const configuredPlatforms: { id: string; name: string; configured: boolean }[] = [
      { id: 'wechat', name: '微信公众号', configured: !!(this.wechatConfig?.appId && this.wechatConfig?.appSecret) },
      { id: 'feishu', name: '飞书文档', configured: !!(this.feishuConfig?.appId && this.feishuConfig?.appSecret) },
      { id: 'notion', name: 'Notion', configured: !!this.notionConfig?.integrationToken },
    ];

    const available = configuredPlatforms.filter(p => p.configured);

    if (available.length === 0) {
      container.style.background = 'var(--background-modifier-info)';
      container.textContent = '⚠️ 暂无已配置的平台，请先在设置中配置微信公众号、飞书文档或 Notion';
    } else {
      container.style.background = 'var(--background-modifier-success)';
      const names = available.map(p => p.name).join('、');
      container.textContent = `✅ 一键发布到：${names}`;
    }
  }

  /**
   * 一键发布到所有已配置的平台
   */
  private async publishToAllPlatforms() {
    const platforms: Array<{
      id: string;
      name: string;
      configured: boolean;
      publishFn?: (content: string, options: PublishOptions) => Promise<any>;
    }> = [
      {
        id: 'wechat',
        name: '微信公众号',
        configured: !!(this.wechatConfig?.appId && this.wechatConfig?.appSecret),
      },
      {
        id: 'feishu',
        name: '飞书文档',
        configured: !!(this.feishuConfig?.appId && this.feishuConfig?.appSecret),
      },
      {
        id: 'notion',
        name: 'Notion',
        configured: !!this.notionConfig?.integrationToken },
    ];

    const availablePlatforms = platforms.filter(p => p.configured);

    if (availablePlatforms.length === 0) {
      new Notice('⚠️ 暂无已配置的平台，请先在设置中配置微信公众号、飞书文档或 Notion');
      return;
    }

    const title = this.extractTitle();
    const results: Array<{ name: string; success: boolean; message?: string; error?: string }> = [];

    new Notice(`正在发布到 ${availablePlatforms.length} 个平台...`);

    for (const platform of availablePlatforms) {
      try {
        const adapter = getPlatformAdapter(platform.id);
        if (!adapter || !adapter.publish) {
          results.push({ name: platform.name, success: false, error: '不支持 API 发布' });
          continue;
        }

        const options: PublishOptions = {
          title,
          coverImage: platform.id === 'wechat' ? this.coverMediaId : undefined,
          wechatConfig: platform.id === 'wechat' ? this.wechatConfig : undefined,
          feishuConfig: platform.id === 'feishu' ? this.feishuConfig : undefined,
          notionConfig: platform.id === 'notion' ? this.notionConfig : undefined,
        };

        const result = await adapter.publish(this.markdown, options);

        if (result.success) {
          results.push({ name: platform.name, success: true, message: result.message });
        } else {
          results.push({ name: platform.name, success: false, error: result.error });
        }
      } catch (error) {
        results.push({
          name: platform.name,
          success: false,
          error: error instanceof Error ? error.message : '发布失败',
        });
      }
    }

    // 显示结果
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    let message = `✅ 发布完成：${successCount} 成功，${failCount} 失败`;
    if (results.length > 0) {
      message += '\n\n' + results.map(r =>
        `${r.success ? '✅' : '❌'} ${r.name}: ${r.message || r.error || '未知'}`
      ).join('\n');
    }

    new Notice(message);
    this.close();
  }

  /**
   * 更新平台提示信息
   */
  private updatePlatformTips(container: HTMLElement) {
    const tips: Record<PlatformType, string> = {
      'wechat': '💡 微信公众号：复制 HTML 后粘贴到公众号编辑器，支持精美排版和代码高亮',
      'feishu': '💡 飞书文档：支持 API 直接创建云文档，也可复制 Markdown 手动粘贴',
      'notion': '💡 Notion：支持 API 直接创建页面，Markdown 会转换为块级元素（标题、列表、代码块等）',
    };

    container.textContent = tips[this.currentPlatform];
  }

  /**
   * 更新主题按钮状态
   */
  private updateThemeButtons() {
    this.themeButtons.forEach((button, themeId) => {
      const theme = getTheme(themeId);
      const isSelected = themeId === this.currentTheme.id;

      button.style.cssText = `
        padding: 8px 16px;
        border: 2px solid ${isSelected ? theme.colors.primary : 'var(--background-modifier-border)'};
        border-radius: 6px;
        background: ${isSelected ? theme.colors.primary + '20' : 'var(--background-primary)'};
        color: var(--text-normal);
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
      `;
    });
  }

  /**
   * 渲染预览内容
   */
  private renderPreview() {
    if (!this.previewContainer) return;

    // 更新平台提示
    const tipContainer = document.getElementById('platform-tips');
    if (tipContainer) {
      this.updatePlatformTips(tipContainer);
    }

    // 更新一键发布提示
    const publishTipContainer = document.getElementById('publish-tip');
    if (publishTipContainer) {
      this.updatePublishTip(publishTipContainer);
    }

    // 根据平台转换内容
    if (this.currentPlatform === 'wechat') {
      // 微信公众号：转换为带样式的 HTML
      const html = markdownToWeChatHTML(this.markdown, this.currentTheme);
      this.previewContainer.innerHTML = html;
    } else if (this.currentPlatform === 'feishu') {
      // 飞书：显示原始 Markdown（飞书支持标准 Markdown）
      this.previewContainer.innerHTML = `<pre style="white-space: pre-wrap; font-family: var(--font-monospace); font-size: 13px;">${this.escapeHtml(this.markdown)}</pre>`;
    } else if (this.currentPlatform === 'notion') {
      // Notion：显示原始 Markdown（Notion 支持 Markdown）
      this.previewContainer.innerHTML = `<pre style="white-space: pre-wrap; font-family: var(--font-monospace); font-size: 13px;">${this.escapeHtml(this.markdown)}</pre>`;
    }

    // 添加滚动到顶部
    const previewWrapper = this.previewContainer.parentElement;
    if (previewWrapper) {
      previewWrapper.scrollTop = 0;
    }
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 提取标题
   */
  private extractTitle(): string {
    const match = this.markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : '无标题';
  }

  /**
   * 复制内容到剪贴板
   */
  private async copyContent() {
    try {
      let content: string;

      if (this.currentPlatform === 'wechat') {
        // 微信公众号：复制 HTML
        content = markdownToWeChatHTML(this.markdown, this.currentTheme);
      } else {
        // 知乎/掘金：复制 Markdown
        content = this.markdown;
      }

      await navigator.clipboard.writeText(content);

      // 显示成功提示
      const platformNames: Record<PlatformType, string> = {
        'wechat': '微信公众号',
        'feishu': '飞书文档',
        'notion': 'Notion',
      };

      this.showSuccessNotice(`✅ 已复制${platformNames[this.currentPlatform]}格式内容到剪贴板！`);
    } catch (error) {
      console.error('复制失败:', error);
      new Notice('复制失败，请手动复制');
    }
  }

  /**
   * 选择封面图片
   */
  private async selectCoverImage() {
    // 检查是否配置了微信公众号
    if (!this.wechatConfig?.appId || !this.wechatConfig?.appSecret) {
      new Notice('请先在设置中配置微信公众号 AppID 和 AppSecret');
      return;
    }

    // 使用 Obsidian 的文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 将文件保存到 Vault 临时目录
      const fileName = file.name;
      const tempPath = normalizePath(`obsidian2mp-covers/${fileName}`);

      try {
        // 确保目录存在
        const vault = this.app.vault;
        const folder = vault.getAbstractFileByPath('obsidian2mp-covers');
        if (!folder) {
          await vault.createFolder('obsidian2mp-covers');
        }

        // 读取文件并保存到 Vault
        const arrayBuffer = await file.arrayBuffer();
        await vault.createBinary(tempPath, arrayBuffer);

        // 上传到微信公众号获取 media_id
        new Notice('正在上传封面图...');
        const client = new WeChatMPClient({
          appId: this.wechatConfig!.appId,
          appSecret: this.wechatConfig!.appSecret,
          app: this.app,
        });

        const result = await client.uploadImageFromLocal(tempPath, fileName);

        this.coverFilePath = tempPath;
        this.coverMediaId = result.mediaId;
        this.coverSource = 'local';

        // 显示预览
        this.updateCoverPreview(file);

        // 更新按钮文字
        if (this.coverUploadBtn) {
          this.coverUploadBtn.textContent = '📁 更换本地图片';
        }
        if (this.coverLibraryBtn) {
          this.coverLibraryBtn.textContent = '🖼️ 选择素材库图片';
        }

        new Notice('✅ 封面上传成功！');
      } catch (error) {
        console.error('上传封面失败:', error);
        new Notice(`上传封面失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };
    input.click();
  }

  /**
   * 清除封面图片
   */
  private clearCoverImage() {
    this.coverFilePath = '';
    this.coverMediaId = '';
    this.coverSource = 'local';
    this.coverLibraryUrl = '';
    this.updateCoverPreview(null);
    new Notice('已清除封面图');
  }

  /**
   * 从素材库选择图片
   */
  private selectFromMaterialLibrary() {
    if (!this.wechatConfig?.appId || !this.wechatConfig?.appSecret) {
      new Notice('请先在设置中配置微信公众号 AppID 和 AppSecret');
      return;
    }

    openMaterialLibraryModal(this.app, this.wechatConfig, (image: MaterialImage) => {
      this.coverMediaId = image.mediaId;
      this.coverSource = 'library';
      this.coverLibraryUrl = image.url;
      this.coverFilePath = '';

      // 显示预览
      this.updateCoverPreviewFromUrl(image.url);

      // 更新按钮文字
      if (this.coverUploadBtn) {
        this.coverUploadBtn.textContent = '📁 选择本地图片';
      }
      if (this.coverLibraryBtn) {
        this.coverLibraryBtn.textContent = '🖼️ 更换素材库图片';
      }

      new Notice('✅ 已选择素材库图片作为封面！');
    });
  }

  /**
   * 从 URL 更新封面预览（素材库图片）
   */
  private updateCoverPreviewFromUrl(url: string) {
    if (!this.coverPreviewEl) return;

    // 加载图片获取尺寸后显示
    const img = new Image();
    img.onload = () => {
      this.coverPreviewEl!.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
      this.coverPreviewEl!.style.display = 'flex';

      // 更新来源标签
      const sourceTag = document.getElementById('cover-source-tag');
      if (sourceTag) {
        sourceTag.textContent = '🖼️ 素材库';
        sourceTag.style.display = 'block';
      }
    };
    img.onerror = () => {
      if (this.coverPreviewEl) {
        this.coverPreviewEl.innerHTML = '<span style="color: var(--text-muted); font-size: 12px;">加载失败</span>';
      }
    };
    img.src = url;
  }

  /**
   * 更新封面预览（本地文件）
   */
  private updateCoverPreview(file: File | null) {
    if (!this.coverPreviewEl) return;

    if (file && this.coverPreviewEl) {
      // 显示本地文件预览
      const url = URL.createObjectURL(file);
      this.coverPreviewEl.innerHTML = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">`;
      this.coverPreviewEl.style.display = 'flex';

      // 更新按钮文字
      if (this.coverUploadBtn) {
        this.coverUploadBtn.textContent = '📁 更换本地图片';
      }
      if (this.coverLibraryBtn) {
        this.coverLibraryBtn.textContent = '🖼️ 选择素材库图片';
      }

      // 更新来源标签
      const sourceTag = document.getElementById('cover-source-tag');
      if (sourceTag) {
        sourceTag.textContent = '📁 本地图片';
        sourceTag.style.display = 'block';
      }
    } else {
      this.coverPreviewEl.innerHTML = '';
      this.coverPreviewEl.style.display = 'none';

      if (this.coverUploadBtn) {
        this.coverUploadBtn.textContent = '📁 选择本地图片';
      }

      // 隐藏来源标签
      const sourceTag = document.getElementById('cover-source-tag');
      if (sourceTag) {
        sourceTag.style.display = 'none';
      }
    }
  }

  /**
   * 显示成功提示
   */
  private showSuccessNotice(message: string) {
    const successDiv = this.contentEl.createDiv({
      text: message,
    });

    successDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      font-size: 16px;
      z-index: 10000;
    `;

    setTimeout(() => {
      successDiv.remove();
      this.close();
    }, 1500);
  }
}

/**
 * 从当前编辑器打开预览
 */
export function openPreviewModal(
  app: App,
  wechatConfig?: { appId: string; appSecret: string; accessToken?: string },
  feishuConfig?: { appId: string; appSecret: string },
  notionConfig?: { integrationToken?: string; databaseId?: string; parentPageId?: string }
) {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) {
    new Notice('请先打开一篇笔记');
    return;
  }

  const markdown = view.editor.getValue();
  const modal = new PreviewModal(app, markdown, wechatConfig, feishuConfig, notionConfig);
  modal.open();
}
