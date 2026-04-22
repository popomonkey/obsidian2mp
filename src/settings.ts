import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import Obsidian2MPPlugin from "./main";
import { getAllThemes } from "./converter";
import { WeChatMPClient, FeishuClient, NotionClient } from "./platforms";
import { WECHAT_PUBLIC_ACCOUNT } from "./donation";

export interface Obsidian2MPSettings {
  defaultTheme: string;
  defaultPlatform: string;
  previewSize: 'small' | 'medium' | 'large';
  // 微信公众号配置
  wechatAppId?: string;
  wechatAppSecret?: string;
  wechatAccessToken?: string;
  wechatProxyUrl?: string; // CORS 代理地址，如 http://127.0.0.1:7890
  // 飞书配置
  feishuAppId?: string;
  feishuAppSecret?: string;
  // Notion 配置
  notionIntegrationToken?: string;
  notionDatabaseId?: string;
  notionParentPageId?: string;
}

const DEFAULT_SETTINGS: Obsidian2MPSettings = {
  defaultTheme: 'tech-blue',
  defaultPlatform: 'wechat',
  previewSize: 'medium',
};

export class Obsidian2MPSettingTab extends PluginSettingTab {
  plugin: Obsidian2MPPlugin;

  constructor(app: App, plugin: Obsidian2MPPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 引流介绍 - 关注公众号
    const introContainer = containerEl.createDiv('intro-container');
    introContainer.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 24px; color: white;';

    const titleEl = introContainer.createEl('h3', { text: '🎉 欢迎关注公众号' });
    titleEl.style.cssText = 'margin: 0 0 12px 0; font-size: 18px;';

    const contentEl = introContainer.createDiv('intro-content');
    contentEl.style.cssText = 'display: flex; gap: 20px; align-items: flex-start;';

    const textEl = contentEl.createDiv('intro-text');
    textEl.style.cssText = 'flex: 1;';
    textEl.innerHTML = `
      <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.95;">
        获取更多 Obsidian 使用技巧和效率工具资讯！
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; opacity: 0.9;">
        <li style="margin: 6px 0;">📝 Obsidian 插件推荐与使用教程</li>
        <li style="margin: 6px 0;">🚀 效率工具测评与技巧分享</li>
        <li style="margin: 6px 0;">💡 知识管理方法论</li>
        <li style="margin: 6px 0;">🎁 独家资源与福利放送</li>
      </ul>
    `;

    const qrEl = contentEl.createDiv('intro-qr');
    qrEl.style.cssText = 'background: white; padding: 10px; border-radius: 8px; text-align: center;';
    const qrImg = qrEl.createEl('img');
    qrImg.src = 'https://s41.ax1x.com/2026/04/10/pew3FMV.jpg';
    qrImg.style.cssText = 'width: 150px; height: 150px;';
    qrEl.createEl('p', { text: '扫码关注公众号' });
    qrEl.style.cssText += ' color: #333; font-size: 12px; margin-top: 8px;';

    containerEl.createEl('h2', { text: '通用设置' });

    new Setting(containerEl)
      .setName("默认主题")
      .setDesc("选择预览和发布时使用的默认排版主题")
      .addDropdown(dropdown => {
        const themes = getAllThemes();
        themes.forEach(theme => {
          dropdown.addOption(theme.id, `${theme.name} - ${theme.description}`);
        });
        dropdown
          .setValue(this.plugin.settings.defaultTheme)
          .onChange(async (value) => {
            this.plugin.settings.defaultTheme = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("默认发布平台")
      .setDesc("选择一键发布的目标平台")
      .addDropdown(dropdown => {
        dropdown
          .addOption('wechat', '微信公众号')
          .addOption('feishu', '飞书文档')
          .addOption('notion', 'Notion')
          .setValue(this.plugin.settings.defaultPlatform)
          .onChange(async (value) => {
            this.plugin.settings.defaultPlatform = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("预览窗口大小")
      .setDesc("设置预览窗口的高度")
      .addDropdown(dropdown => {
        dropdown
          .addOption('small', '小 (40vh)')
          .addOption('medium', '中 (60vh)')
          .addOption('large', '大 (80vh)')
          .setValue(this.plugin.settings.previewSize)
          .onChange(async (value) => {
            this.plugin.settings.previewSize = value as 'small' | 'medium' | 'large';
            await this.plugin.saveSettings();
          });
      });

    // 微信公众号配置
    containerEl.createEl('h2', { text: '微信公众号配置' });

    new Setting(containerEl)
      .setName("WeChat App ID")
      .setDesc("公众号 AppID（用于直接 API 发布）")
      .addText(text => text
        .setPlaceholder("输入 App ID")
        .setValue(this.plugin.settings.wechatAppId || "")
        .onChange(async (value) => {
          this.plugin.settings.wechatAppId = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("WeChat App Secret")
      .setDesc("公众号 AppSecret（用于直接 API 发布）")
      .addText(text => text
        .setPlaceholder("输入 App Secret")
        .setValue(this.plugin.settings.wechatAppSecret || "")
        .onChange(async (value) => {
          this.plugin.settings.wechatAppSecret = value;
          await this.plugin.saveSettings();
        }));

    // 连接测试按钮
    new Setting(containerEl)
      .setName("测试连接")
      .setDesc("测试微信公众号 API 连通性")
      .addButton(button => {
        button
          .setButtonText("测试连接")
          .onClick(async () => {
            if (!this.plugin.settings.wechatAppId || !this.plugin.settings.wechatAppSecret) {
              new Notice("请先配置 AppID 和 AppSecret");
              return;
            }

            button.setDisabled(true);
            button.setButtonText("测试中...");

            try {
              const client = new WeChatMPClient({
                appId: this.plugin.settings.wechatAppId,
                appSecret: this.plugin.settings.wechatAppSecret,
              });

              const error = await client.testConnection();

              if (error) {
                new Notice(`❌ 连接失败: ${error}`);
              } else {
                new Notice("✅ 连接成功！Access Token 获取正常");
              }
            } catch (e) {
              new Notice(`❌ 连接失败: ${e instanceof Error ? e.message : '未知错误'}`);
            } finally {
              button.setDisabled(false);
              button.setButtonText("测试连接");
            }
          });
      });

    // 飞书配置
    containerEl.createEl('h3', { text: '飞书文档配置' });

    new Setting(containerEl)
      .setName("Feishu App ID")
      .setDesc("飞书应用 AppID（用于 API 创建文档）")
      .addText(text => text
        .setPlaceholder("输入 App ID")
        .setValue(this.plugin.settings.feishuAppId || "")
        .onChange(async (value) => {
          this.plugin.settings.feishuAppId = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Feishu App Secret")
      .setDesc("飞书应用 AppSecret（用于 API 创建文档）")
      .addText(text => text
        .setPlaceholder("输入 App Secret")
        .setValue(this.plugin.settings.feishuAppSecret || "")
        .onChange(async (value) => {
          this.plugin.settings.feishuAppSecret = value;
          await this.plugin.saveSettings();
        }));

    // 飞书连接测试按钮
    new Setting(containerEl)
      .setName("测试连接")
      .setDesc("测试飞书 API 连通性")
      .addButton(button => {
        button
          .setButtonText("测试连接")
          .onClick(async () => {
            if (!this.plugin.settings.feishuAppId || !this.plugin.settings.feishuAppSecret) {
              new Notice("请先配置 AppID 和 AppSecret");
              return;
            }

            button.setDisabled(true);
            button.setButtonText("测试中...");

            try {
              const client = new FeishuClient({
                appId: this.plugin.settings.feishuAppId,
                appSecret: this.plugin.settings.feishuAppSecret,
              });

              const error = await client.testConnection();

              if (error) {
                new Notice(`❌ 连接失败: ${error}`);
              } else {
                new Notice("✅ 连接成功！Access Token 获取正常");
              }
            } catch (e) {
              new Notice(`❌ 连接失败: ${e instanceof Error ? e.message : '未知错误'}`);
            } finally {
              button.setDisabled(false);
              button.setButtonText("测试连接");
            }
          });
      });

    // Notion 配置
    containerEl.createEl('h3', { text: 'Notion 配置' });

    const notionDesc = document.createElement('div');
    notionDesc.style.cssText = 'color: var(--text-muted); font-size: 13px; margin-bottom: 12px;';
    notionDesc.innerHTML = `
      💡 配置 Notion Integration 后，可直接将笔记发布到 Notion 页面或数据库。<br>
      <a href="https://developers.notion.com/docs/create-a-notion-integration" target="_blank">查看配置教程</a>
    `;
    containerEl.appendChild(notionDesc);

    new Setting(containerEl)
      .setName("Integration Token")
      .setDesc("Notion 集成令牌（必需）")
      .addText(text => text
        .setPlaceholder("secret_xxx...")
        .setValue(this.plugin.settings.notionIntegrationToken || "")
        .onChange(async (value) => {
          this.plugin.settings.notionIntegrationToken = value;
          await this.plugin.saveSettings();
        }));

    // Notion 连接测试按钮
    new Setting(containerEl)
      .setName("测试连接")
      .setDesc("测试 Notion API 连通性")
      .addButton(button => {
        button
          .setButtonText("测试连接")
          .onClick(async () => {
            if (!this.plugin.settings.notionIntegrationToken) {
              new Notice("请先配置 Integration Token");
              return;
            }

            button.setDisabled(true);
            button.setButtonText("测试中...");

            try {
              const client = new NotionClient({
                integrationToken: this.plugin.settings.notionIntegrationToken,
              });

              const error = await client.testConnection();

              if (error) {
                new Notice(`❌ 连接失败: ${error}`);
              } else {
                new Notice("✅ 连接成功！Token 验证通过");
              }
            } catch (e) {
              new Notice(`❌ 连接失败: ${e instanceof Error ? e.message : '未知错误'}`);
            } finally {
              button.setDisabled(false);
              button.setButtonText("测试连接");
            }
          });
      });

    new Setting(containerEl)
      .setName("Parent Page ID")
      .setDesc("父页面 ID（可选，发布到此页面下）")
      .addText(text => text
        .setPlaceholder("页面 ID，如：abc123...")
        .setValue(this.plugin.settings.notionParentPageId || "")
        .onChange(async (value) => {
          this.plugin.settings.notionParentPageId = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Database ID")
      .setDesc("数据库 ID（可选，发布到此数据库）")
      .addText(text => text
        .setPlaceholder("数据库 ID，如：def456...")
        .setValue(this.plugin.settings.notionDatabaseId || "")
        .onChange(async (value) => {
          this.plugin.settings.notionDatabaseId = value;
          await this.plugin.saveSettings();
        }));

    // 关于
    containerEl.createEl('h2', { text: '关于' });

    const aboutEl = containerEl.createDiv('about-section');
    aboutEl.style.cssText = 'color: var(--text-muted); font-size: 13px;';
    aboutEl.innerHTML = `
      <p><strong>Obsidian2MP</strong> 是一款完全免费的 Obsidian 插件，由开发者用爱发电维护。</p>
      <p>如果你觉得这个插件有帮助，可以：</p>
      <ul>
        <li>⭐ 在 GitHub 上给个 Star</li>
        <li>📢 推荐给你身边写公众号的朋友</li>
      </ul>
      <p>GitHub: <a href="https://github.com/popomonkey/obsidian2mp" target="_blank">popomonkey/obsidian2mp</a></p>
    `;

    // 关注公众号区域
    const followSection = containerEl.createDiv('follow-section');
    followSection.style.cssText = 'margin-top: 20px; padding: 16px; background: var(--background-secondary); border-radius: 8px; text-align: center;';
    followSection.innerHTML = `
      <p style="margin: 0 0 12px 0; font-weight: bold; color: var(--text-normal);">📢 关注公众号</p>
      <p style="margin: 0 0 12px 0; color: var(--text-muted); font-size: 12px;">扫码关注，获取更多插件动态和更新通知</p>
      <img src="${WECHAT_PUBLIC_ACCOUNT.qrcode}" alt="${WECHAT_PUBLIC_ACCOUNT.name}" style="width: 160px; height: 160px; border-radius: 8px; margin: 8px 0;">
      <p style="margin: 8px 0 0 0; color: var(--text-muted); font-size: 12px;">${WECHAT_PUBLIC_ACCOUNT.name}</p>
    `;
  }
}