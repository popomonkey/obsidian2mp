/**
 * WeChat Material Library Modal
 * 微信公众号素材库选择弹窗
 */

import { App, Modal, Setting, Notice, requestUrl } from 'obsidian';
import { WeChatMPClient } from '../platforms/wechat';

export interface MaterialImage {
  mediaId: string;
  name: string;
  url: string;
  updateTime: number;
}

export class MaterialLibraryModal extends Modal {
  private appInstance: App;
  private wechatConfig: { appId: string; appSecret: string };
  private client: WeChatMPClient;
  private materials: MaterialImage[] = [];
  private selectedImage: MaterialImage | null = null;
  private onSelect: (image: MaterialImage) => void;
  private materialContainer: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;
  private currentPage: number = 0;
  private pageSize: number = 6;
  private totalCount: number = 0;
  private paginationEl: HTMLElement | null = null;

  constructor(
    app: App,
    wechatConfig: { appId: string; appSecret: string },
    onSelect: (image: MaterialImage) => void
  ) {
    super(app);
    this.appInstance = app;
    this.wechatConfig = wechatConfig;
    this.client = new WeChatMPClient({ ...wechatConfig, app }, app);
    this.onSelect = onSelect;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    this.setTitle('选择素材库图片');

    // 创建容器
    const container = contentEl.createDiv('material-container');
    container.style.cssText = `
      max-height: 60vh;
      overflow-y: auto;
      padding: 16px;
    `;
    this.materialContainer = container;

    // 创建加载状态
    const loading = contentEl.createDiv('loading');
    loading.style.cssText = `
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    `;
    loading.textContent = '加载中...';
    this.loadingEl = loading;

    // 加载素材
    this.loadMaterials();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * 加载素材库图片
   * @param page 页码（从0开始）
   */
  private async loadMaterials(page: number = 0) {
    this.currentPage = page;
    const offset = page * this.pageSize;

    try {
      if (this.loadingEl) {
        this.loadingEl.style.display = 'block';
        this.loadingEl.textContent = '加载中...';
      }
      if (this.materialContainer) {
        this.materialContainer.innerHTML = '';
      }

      const accessToken = await this.client.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${accessToken}`;

      const resp = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'image',
          offset: offset,
          count: this.pageSize,
        }),
      });

      if (resp.json.errcode && resp.json.errcode !== 0) {
        throw new Error(resp.json.errmsg || '获取素材列表失败');
      }

      this.totalCount = resp.json.total_count || 0;
      this.materials = (resp.json.item || []).map((item: any) => ({
        mediaId: item.media_id,
        name: item.name || '未命名',
        url: item.url,
        updateTime: item.update_time * 1000,
      }));

      this.renderMaterials();
    } catch (error) {
      console.error('加载素材库失败:', error);
      if (this.loadingEl) {
        this.loadingEl.textContent = `加载失败: ${error instanceof Error ? error.message : '未知错误'}`;
      }
    }
  }

  /**
   * 渲染素材列表
   */
  private renderMaterials() {
    if (!this.materialContainer || !this.loadingEl) return;

    this.loadingEl.style.display = 'none';

    if (this.materials.length === 0) {
      this.materialContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          素材库为空，请先上传图片
        </div>
      `;
      return;
    }

    // 网格布局
    const grid = this.materialContainer.createDiv('material-grid');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    `;

    this.materials.forEach((material) => {
      const item = grid.createDiv('material-item');
      item.style.cssText = `
        border: 2px solid var(--background-modifier-border);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      `;

      // 选中状态
      if (this.selectedImage?.mediaId === material.mediaId) {
        item.style.borderColor = 'var(--text-accent)';
        item.style.boxShadow = '0 0 0 2px var(--text-accent)';
      }

      // 图片
      const img = item.createEl('img');
      img.src = material.url;
      img.style.cssText = `
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        display: block;
      `;

      // 名称
      const name = item.createDiv('material-name');
      name.style.cssText = `
        padding: 8px;
        font-size: 12px;
        color: var(--text-normal);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        background: var(--background-secondary);
      `;
      name.textContent = material.name;

      // 点击选择
      item.addEventListener('click', () => {
        this.selectImage(material);
      });
    });

    // 渲染分页控件
    this.renderPagination();

    // 底部按钮
    this.renderButtons();
  }

  /**
   * 渲染分页控件
   */
  private renderPagination() {
    // 移除旧的分页控件
    if (this.paginationEl) {
      this.paginationEl.remove();
    }

    const totalPages = Math.ceil(this.totalCount / this.pageSize);
    if (totalPages <= 1) return;

    const paginationEl = this.contentEl.createDiv('pagination');
    paginationEl.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--background-modifier-border);
    `;

    // 上一页
    const prevBtn = paginationEl.createEl('button');
    prevBtn.textContent = '上一页';
    prevBtn.disabled = this.currentPage === 0;
    prevBtn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      font-size: 13px;
    `;
    if (prevBtn.disabled) {
      prevBtn.style.opacity = '0.5';
      prevBtn.style.cursor = 'not-allowed';
    } else {
      prevBtn.addEventListener('click', () => {
        this.loadMaterials(this.currentPage - 1);
      });
    }

    // 页码信息
    const info = paginationEl.createSpan();
    info.style.cssText = `
      padding: 0 12px;
      font-size: 13px;
      color: var(--text-muted);
    `;
    info.textContent = `${this.currentPage + 1} / ${totalPages}`;

    // 下一页
    const nextBtn = paginationEl.createEl('button');
    nextBtn.textContent = '下一页';
    nextBtn.disabled = this.currentPage >= totalPages - 1;
    nextBtn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      font-size: 13px;
    `;
    if (nextBtn.disabled) {
      nextBtn.style.opacity = '0.5';
      nextBtn.style.cursor = 'not-allowed';
    } else {
      nextBtn.addEventListener('click', () => {
        this.loadMaterials(this.currentPage + 1);
      });
    }

    this.paginationEl = paginationEl;
  }

  /**
   * 渲染底部按钮
   */
  private renderButtons() {
    // 移除旧的按钮容器
    const existingContainer = this.contentEl.querySelector('.button-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const buttonContainer = this.contentEl.createDiv('button-container');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid var(--background-modifier-border);
    `;

    const selectBtn = buttonContainer.createEl('button', { text: '选择所选图片' });
    selectBtn.style.cssText = `
      padding: 8px 20px;
      border: none;
      border-radius: 6px;
      background: var(--text-accent);
      color: white;
      cursor: pointer;
      font-size: 14px;
    `;
    selectBtn.disabled = !this.selectedImage;
    selectBtn.addEventListener('click', () => {
      if (this.selectedImage) {
        this.onSelect(this.selectedImage);
        this.close();
      }
    });

    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = `
      padding: 8px 20px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      font-size: 14px;
    `;
    cancelBtn.addEventListener('click', () => this.close());
  }

  /**
   * 选择图片
   */
  private selectImage(material: MaterialImage) {
    this.selectedImage = material;
    this.renderMaterials();
  }
}

/**
 * 打开素材库选择弹窗
 */
export function openMaterialLibraryModal(
  app: App,
  wechatConfig: { appId: string; appSecret: string },
  onSelect: (image: MaterialImage) => void
) {
  const modal = new MaterialLibraryModal(app, wechatConfig, onSelect);
  modal.open();
}