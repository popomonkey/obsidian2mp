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

    // 引流介绍 + 关于 - 放在页面顶部
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
    // 使用 base64 编码的本地二维码图片，无需网络请求
    qrImg.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAGuAa4DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiuV+KPxR8MfBjwLqfjLxlqf9j+G9M8r7Xe/Z5Z/L8yVIk+SJWc5eRBwpxnJwATQB1VFfKv8Aw9H/AGYv+im/+UDVP/kaj/h6P+zF/wBFN/8AKBqn/wAjUAfVVFfKv/D0f9mL/opv/lA1T/5Go/4ej/sxf9FN/wDKBqn/AMjUAfVVFfKv/D0f9mL/AKKb/wCUDVP/AJGo/wCHo/7MX/RTf/KBqn/yNQB9VUV8q/8AD0f9mL/opv8A5QNU/wDkaj/h6P8Asxf9FN/8oGqf/I1AH1VRXlXwL/aj+GH7Sn9t/wDCuPE3/CR/2L5H2/8A0C6tfJ87zPK/18Sbs+VJ93ONvOMjIB6rRRRQAUV8p/8PR/2Yv+im/+UDVP/kajoD4W/FPwz8Z/A2m+MfB+onV/DmomX7JfeRJB5vlyvE/ySKrjDxuOVGcZGQQaAOsoryr45/tRfDH9mw6J/wALH8Tf8I5/bXn/ABDNhdXXneT5fm/6iJ9uPNj+9jO7jODjyr/h6P+zF/0U3/AMoGqf8AyNQB9VUV8q/8PR/2Yv8Aopv/AJQNU/8Akaj/AIej/sxf9FN/8oGqf/I1AH1VRXKfC34peGPjT4E0zxl4N1P+2fDepeb9kvfs8sHmeXK8T/ACSqrjDxuOVGcZHBBrlfjn+1F8Mf2bDon/Cx/E3/AAkf9i+R9v8A9AurXyfO8zyv9fEm7PlSfdzjbzjIyAeUf8EuP+T7Phl/3E/8A013dfv9TI8Yp9ADKfTKeKAP5WP+Cov/J9HxL/7hn/pstK+q/+CGP/NbP+4J/7f1+V8jb8HcXOMCx5r9EP8Aglx/yYn8Mv+4n/AOnS7oA+qqK/Kr/gud0+CX/cb/APbCvysoA/qmyfSjJ9K/lb/Af0o/wH9KAP6pMn0oyfSv5W/wDgP6Un4fpQB/VJk+hoz6V/K3+A/pSfh+lAH9UmT6UZPpX8rf4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov/ACfR8S/+4Z/6bLSgD5Wor9U/+CGX/NbP+4J/7f1+qVAH8rVFf1S0UAfytUV/VLQOtAH8rVFfv5/wVE/5MU+Jn/cN/wDTpaV+AdAH9VFFFFABRRRQAUUUUAFfKv/BUf/kxP4m/9wz/06WlfVVfKv/BUf/kxP4m/9wz/ANOlpQB+AR6V/VKetfytHpX9Up60AfkF+3p+3p8dvgr+1h468GeDPHX9j+G9N+w/ZLL+yLGfy/MsbeV/nlgZzl5HPLHGcDAAFeAf8AD0f9p3/opv8A5QNL/wDkaj/gqP8A8n2fE3/uGf8AprtK+VaAPqr/AIej/tO/9FN/8oGl/wDyNR/w9H/ad/6KZ/5QNL/+Rq+VaKAP6pFUgAFuh/OvwG/4Kj/8n1fEz/uGf+my0r9+yOa/AT/gqN/yfT8TP+4Z/6bLSgD6p/4IY/8ANbP+4J/7f1+qdflX/wAFMf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/r8r5G34O4uccljX6of8EMf+a2f9wT/ANv6AP1UooooA/lXr9/v+CXx/wCMFPhp/wBxP/053VfgDRQB+qn/AAXO/wCaJ/8Acb/9sK/KuiigAooooA/f7/glx/yYn8Mv+4n/AOnS7r5V/wCC53/NE/8AuN/+2FfVX/BLj/kxP4Zf9xP/ANOl3X1VQB+AP/BLr/k+n4Zf9xP/ANNl3X7/AFfKv/BUXH/DC3xLDZx/xLM49P7UtK/APlzxwB2oA/qmor+VjGOtfv5/wS7/AOTFfhn/ANxP/wBOl3QB9V0V+VX/AAXO6/BP/uN/+2FflZQB/VNk+lGT6Gv5W/w/Sj/gP6UAf1SZPoaMn0r+Vv8A4D+lJ+H6UAf1T0V+AP8AwS5H/Gdfwz/7if8A6a7uv3+oAK/AD/gqL/yfR8S/+4Z/6bLSv3/r8AP+Cov8AyfR8S/8AuGf+my0oA+qf+CGP/NbP+4J/7f1+qdflZ/wQx/5rZ/3BP8A2/r9U6ACvwA/4Kjf8n0fEv/uGf8ApstK/f6vwA/4Ki/8n0fEv/uGf+my0oA+qv8Aghj/AM1s/wC4J/7f1+qlfmn/AMEOfv8Axr/7gn/t/X6qUAfyr1/VRRX8q45NAH1T/wAFRf8Ak+j4l/8AcM/9NlpX1X/wQx/5rZ/3BP8A2/or8A/+HY37Mn/RMx/4P9U/+SaAP/2Q==';
    qrImg.style.cssText = 'width: 150px; height: 150px;';
    qrEl.createEl('p', { text: '扫码关注公众号' });
    qrEl.style.cssText += ' color: #333; font-size: 12px; margin-top: 8px;';

    // 关于信息 - 放在顶部引流区下方
    const aboutSection = introContainer.createDiv('about-section');
    aboutSection.style.cssText = 'margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);';
    aboutSection.innerHTML = `
      <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.95;"><strong>关于 Obsidian2MP</strong></p>
      <p style="margin: 0 0 8px 0; font-size: 13px; opacity: 0.9;">
        一款完全免费的 Obsidian 插件，由开发者用爱发电维护。
      </p>
      <p style="margin: 0 0 8px 0; font-size: 13px; opacity: 0.9;">
        如果你觉得这个插件有帮助，可以：
      </p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; opacity: 0.9;">
        <li style="margin: 4px 0;">⭐ 在 GitHub 上给个 Star</li>
        <li style="margin: 4px 0;">📢 推荐给你身边写公众号的朋友</li>
      </ul>
      <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">
        GitHub: <a href="https://github.com/popomonkey/obsidian2mp" target="_blank" style="color: white; text-decoration: underline;">popomonkey/obsidian2mp</a>
      </p>
    `;

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

    // 注意：微信信息和关于信息已移至页面顶部，此处不再重复显示
  }
}