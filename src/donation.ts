/**
 * 微信公众号/关注模块
 * 免费插件，靠爱发电，欢迎关注支持
 */

import { Modal, Setting, Notice } from 'obsidian';

/**
 * 微信公众号二维码（请替换成你自己的）
 */
const WECHAT_PUBLIC_ACCOUNT = {
  qrcode: 'https://s41.ax1x.com/2026/04/10/pew3FMV.jpg', // 微信公众号二维码
  name: 'PM智圈|PMAIhub', // 公众号名称（用于显示）
};

/**
 * 显示微信公众号关注弹窗
 */
export function showDonationModal(app: any): void {
  const modal = new DonationModal(app);
  modal.open();
}

/**
 * 打赏弹窗组件
 */
class DonationModal extends Modal {
  constructor(app: any) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    this.setTitle('📢 关注公众号');

    const container = contentEl.createDiv('donation-container');
    container.style.cssText = 'padding: 20px; text-align: center;';

    // 描述文字
    const descEl = container.createDiv('donation-desc');
    descEl.style.cssText = 'margin-bottom: 20px; color: var(--text-muted); font-size: 14px;';
    descEl.innerHTML = `
      <p style="margin: 0 0 10px 0;">本插件完全免费，由开发者用爱发电维护</p>
      <p style="margin: 0;">如果觉得对你有帮助，欢迎关注公众号支持一下 👏</p>
    `;

    // 微信公众号二维码
    const qrContainer = container.createDiv('donation-qr');
    qrContainer.style.cssText = 'display: flex; justify-content: center; margin: 20px 0;';

    const wechatDiv = qrContainer.createDiv('donation-wechat');
    wechatDiv.style.cssText = 'text-align: center;';
    wechatDiv.createEl('p', { text: WECHAT_PUBLIC_ACCOUNT.name || '微信公众号' });
    const wechatImg = wechatDiv.createEl('img');
    wechatImg.src = WECHAT_PUBLIC_ACCOUNT.qrcode || 'https://via.placeholder.com/200x200?text=微信公众号';
    wechatImg.style.cssText = 'width: 200px; height: 200px; border-radius: 8px;';

    // 其他支持方式
    const otherContainer = container.createDiv('donation-other');
    otherContainer.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--background-modifier-border);';
    const otherTitle = otherContainer.createEl('p', { text: '其他免费支持方式：' });
    otherTitle.style.cssText = 'font-weight: bold; margin-bottom: 10px;';
    otherContainer.createEl('ul', {}, ul => {
      const links = [
        { text: '在 GitHub 上给个 Star', href: 'https://github.com/popomonkey/obsidian2mp' },
        { text: '推荐给你身边写公众号的朋友', href: '' },
      ];
      links.forEach(link => {
        const li = ul.createEl('li');
        li.style.cssText = 'margin: 5px 0; color: var(--text-muted);';
        if (link.href) {
          const a = li.createEl('a', { text: link.text, href: link.href });
          a.target = '_blank';
        } else {
          li.textContent = link.text;
        }
      });
    });

    // 关闭按钮
    new Setting(container).addButton(button => {
      button.setButtonText('关闭').onClick(() => this.close());
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

/**
 * 在设置页面添加关注入口
 */
export function createDonationSetting(containerEl: HTMLElement, app: any): void {
  new Setting(containerEl)
    .setName('📢 关注公众号')
    .setDesc('本插件完全免费，如果对你有帮助，欢迎关注支持')
    .addButton(button => {
      button
        .setButtonText('关注')
        .setCta()
        .onClick(() => {
          showDonationModal(app);
        });
    });
}
