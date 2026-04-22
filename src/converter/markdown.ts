/**
 * Markdown to WeChat HTML Converter
 * 使用 marked 解析 Markdown，然后注入微信兼容的样式
 */

import { marked } from 'marked';
import hljs from 'highlight.js';
import { WeChatTheme } from './theme';

/**
 * 配置 marked 使用 highlight.js 进行代码高亮
 */
marked.setOptions({
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
} as any);

/**
 * 将 Markdown 转换为微信公众号兼容的 HTML
 */
export function markdownToWeChatHTML(markdown: string, theme: WeChatTheme): string {
  // 使用 marked 解析 Markdown
  const rawHtml = marked.parse(markdown, { async: false }) as string;

  // 注入主题样式
  let html = injectThemeStyles(rawHtml, theme);

  // 应用微信公众号特殊格式适配
  html = adaptToWeChatMP(html);

  return html;
}

/**
 * 适配微信公众号的 HTML 格式要求
 */
function adaptToWeChatMP(html: string): string {
  let result = html;

  // 1. 图片处理：微信公众号需要 data-src 属性
  result = result.replace(/<img([^>]*)src="([^"]*)"([^>]*)>/g,
    (match, before, src, after) => {
      // 已经有 data-src 的跳过
      if (match.includes('data-src')) {
        return match;
      }
      // 将 src 转为 data-src，保留一个空的 src 兼容其他编辑器
      const newTag = `<img${before}data-src="${src}"${after} data-mce-src="${src}" data-mce-style="max-width: 100%;">`;
      return newTag;
    }
  );

  // 2. 添加 XML 注释包裹，确保格式被识别
  // 微信公众号有时需要这种格式
  result = result.replace(/^(<!DOCTYPE html>)?/i, '');

  // 3. 确保有正确的文档类型注释（可选，帮助识别）
  if (!result.includes('<!--html-->') && !result.startsWith('<!DOCTYPE')) {
    result = `<!--html-->\n${result}`;
  }

  return result;
}

/**
 * 注入主题样式到 HTML
 */
function injectThemeStyles(html: string, theme: WeChatTheme): string {
  const { colors, fontSize, lineHeight } = theme;

  // 处理标题
  html = html
    // H1 - 带序号和左侧色条（md2wechat 风格）
    .replace(/<h1>(.*?)<\/h1>/g,
      `<section style="display: flex; align-items: center; margin: 28px 0 20px; padding: 0 0 0 14px; border-left: 5px solid ${colors.primary};">
        <span style="font-size: ${fontSize.h1}px; font-weight: bold; color: ${colors.primary}; line-height: ${lineHeight};">$1</span>
      </section>`
    )
    // H2 - 带背景渐变（md2wechat 风格）
    .replace(/<h2>(.*?)<\/h2>/g,
      `<section style="margin: 24px 0 16px; padding: 10px 16px; background: linear-gradient(90deg, ${colors.primary}18 0%, ${colors.primary}08 100%); font-size: ${fontSize.h2}px; font-weight: bold; color: ${colors.primary}; line-height: ${lineHeight}; border-radius: 6px;">
        $1
      </section>`
    )
    // H3 - 简洁加粗带色条
    .replace(/<h3>(.*?)<\/h3>/g,
      `<section style="margin: 20px 0 12px; padding-left: 10px; border-left: 3px solid ${colors.primary}; font-size: ${fontSize.h3}px; font-weight: bold; color: ${colors.primary}; line-height: ${lineHeight};">
        $1
      </section>`
    )
    // 粗体 - 使用主题色
    .replace(/<strong>(.*?)<\/strong>/g,
      `<strong style="color: ${colors.primary}; font-weight: bold;">$1</strong>`
    )
    // 斜体
    .replace(/<em>(.*?)<\/em>/g,
      `<em style="font-style: italic; color: #666;">$1</em>`
    )
    // 链接
    .replace(/<a href="(.*?)">(.*?)<\/a>/g,
      `<a href="$1" style="color: ${colors.link}; text-decoration: none; border-bottom: 1px solid ${colors.link}; word-break: break-all; transition: all 0.2s;">$2</a>`
    )
    // 引用块 - md2wechat 风格
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/g,
      `<section style="margin: 20px 0; padding: 16px 18px; border-left: 4px solid ${colors.quoteBorder}; background: linear-gradient(to right, ${colors.quoteBorder}10, transparent); color: #666; line-height: ${lineHeight}; border-radius: 4px;">
        $1
      </section>`
    )
    // 段落
    .replace(/<p>(.*?)<\/p>/g,
      `<p style="margin: 16px 0; font-size: ${fontSize.body}px; line-height: ${lineHeight}; color: #333; text-align: justify; letter-spacing: 0.5px;">$1</p>`
    )
    // 无序列表 - md2wechat 风格
    .replace(/<ul>([\s\S]*?)<\/ul>/g,
      `<ul style="margin: 16px 0; padding-left: 18px; list-style: none;">$1</ul>`
    )
    // 有序列表
    .replace(/<ol>([\s\S]*?)<\/ol>/g,
      `<ol style="margin: 16px 0; padding-left: 18px; list-style: decimal;">$1</ol>`
    )
    // 列表项 - 自定义样式
    .replace(/<li>(.*?)<\/li>/g,
      `<li style="margin: 8px 0; line-height: ${lineHeight}; color: #333; position: relative; padding-left: 8px;">$1</li>`
    )
    // 无序列表项添加圆点
    .replace(/<ul style="margin: 16px 0; padding-left: 18px; list-style: none;">([\s\S]*?)<\/ul>/g,
      (match, content) => {
        return `<ul style="margin: 16px 0; padding-left: 18px; list-style: none;">
          ${content.replace(/<li style="margin: 8px 0; line-height:.*?>/g,
            `<li style="margin: 8px 0; line-height: ${lineHeight}; color: #333; position: relative; padding-left: 12px;">
              <span style="position: absolute; left: -4px; top: 10px; width: 6px; height: 6px; border-radius: 50%; background: ${colors.primary};"></span>`
          )}
        </ul>`;
      }
    )
    // 分割线 - md2wechat 风格
    .replace(/<hr>/g,
      `<hr style="border: none; border-top: 2px solid ${colors.primary}30; margin: 28px 0;" />`
    )
    // 表格容器
    .replace(/<table>([\s\S]*?)<\/table>/g,
      `<div style="margin: 20px 0; overflow-x: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">$1</div>`
    )
    .replace(/<thead>/g, '<thead style="background: linear-gradient(to right, ${colors.primary}18, ${colors.primary}08);">')
    .replace(/<th>/g, `<th style="padding: 12px 16px; border: 1px solid ${colors.primary}30; font-weight: bold; color: ${colors.primary}; text-align: left;">`)
    .replace(/<td>/g, '<td style="padding: 12px 16px; border: 1px solid #e1e4e8; color: #333;">')
    .replace(/<tr>/g, '<tr style="background: #fff;">');

  // 处理代码块 - Mac 窗口风格（优化）
  html = html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (match, lang, code) => {
      const langName = getLanguageName(lang);
      return `
<div style="margin: 20px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.12);">
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: ${colors.codeBlockHeader};">
    <div style="display: flex; gap: 7px;">
      <span style="width: 13px; height: 13px; border-radius: 50%; background: #ff5f56; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
      <span style="width: 13px; height: 13px; border-radius: 50%; background: #ffbd2e; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
      <span style="width: 13px; height: 13px; border-radius: 50%; background: #27c93f; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></span>
    </div>
    <span style="font-size: 12px; color: #888; text-transform: uppercase; font-weight: 500;">${langName}</span>
  </div>
  <pre style="margin: 0; padding: 18px; background: ${colors.codeBg}; overflow-x: auto;">
    <code style="font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace; font-size: 14px; line-height: 1.65; color: ${colors.codeFg}; white-space: pre; display: block;">${code}</code>
  </pre>
</div>`;
    }
  );

  // 处理行内代码
  html = html.replace(/<code>(?!.*<\/pre>)(.*?)<\/code>/g,
    `<code style="background: ${colors.primary}15; padding: 3px 8px; border-radius: 5px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace; font-size: 13px; color: ${colors.primary}; border: 1px solid ${colors.primary}20;">$1</code>`
  );

  // 包装在容器中，添加顶部和底部装饰
  return `<section style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: ${lineHeight}; color: #333; padding: 10px 12px;">
    ${html}
  </section>`;
}

/**
 * 获取语言的显示名称
 */
function getLanguageName(lang: string): string {
  const langMap: Record<string, string> = {
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    py: 'Python',
    go: 'Go',
    java: 'Java',
    cs: 'C#',
    cpp: 'C++',
    c: 'C',
    rb: 'Ruby',
    php: 'PHP',
    sh: 'Shell',
    bash: 'Bash',
    sql: 'SQL',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    swift: 'Swift',
    kt: 'Kotlin',
    rs: 'Rust',
  };
  return langMap[lang.toLowerCase()] || lang;
}

/**
 * 导出 marked 实例供其他模块使用
 */
export { marked };
