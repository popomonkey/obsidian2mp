/**
 * WeChat Theme Definitions
 * 三种预设主题：技术蓝、极客黑、简约灰
 */

export interface ThemeColors {
  primary: string;       // 主色调
  link: string;          // 链接颜色
  quoteBorder: string;   // 引用边框
  codeBg: string;        // 代码背景
  codeFg: string;        // 代码前景
  codeBlockHeader: string; // 代码块头部背景
}

export interface ThemeFontSize {
  h1: number;
  h2: number;
  h3: number;
  body: number;
}

export interface WeChatTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fontSize: ThemeFontSize;
  lineHeight: number;
}

/**
 * 技术蓝主题 - 适合技术教程、产品介绍
 */
export const TECH_BLUE: WeChatTheme = {
  id: 'tech-blue',
  name: '技术蓝',
  description: '清爽专业的蓝色系，适合技术类文章',
  colors: {
    primary: '#1e80ff',
    link: '#1e80ff',
    quoteBorder: '#1e80ff',
    codeBg: '#1e1e1e',
    codeFg: '#d4d4d4',
    codeBlockHeader: '#2d2d2d',
  },
  fontSize: {
    h1: 20,
    h2: 18,
    h3: 16,
    body: 15,
  },
  lineHeight: 1.75,
};

/**
 * 极客黑主题 - 适合代码密集型文章
 */
export const GEEK_BLACK: WeChatTheme = {
  id: 'geek-black',
  name: '极客黑',
  description: '深色极客风，适合代码展示',
  colors: {
    primary: '#24292f',
    link: '#0969da',
    quoteBorder: '#24292f',
    codeBg: '#0d1117',
    codeFg: '#c9d1d9',
    codeBlockHeader: '#161b22',
  },
  fontSize: {
    h1: 20,
    h2: 18,
    h3: 16,
    body: 15,
  },
  lineHeight: 1.75,
};

/**
 * 简约灰主题 - 适合通用、文艺类内容
 */
export const MINIMAL_GRAY: WeChatTheme = {
  id: 'minimal-gray',
  name: '简约灰',
  description: '简约优雅的灰色系，适合通用场景',
  colors: {
    primary: '#576b95',
    link: '#576b95',
    quoteBorder: '#dfe2e5',
    codeBg: '#f6f8fa',
    codeFg: '#24292f',
    codeBlockHeader: '#eaecef',
  },
  fontSize: {
    h1: 20,
    h2: 18,
    h3: 16,
    body: 15,
  },
  lineHeight: 1.75,
};

/**
 * 所有可用主题
 */
export const THEMES: Record<string, WeChatTheme> = {
  'tech-blue': TECH_BLUE,
  'geek-black': GEEK_BLACK,
  'minimal-gray': MINIMAL_GRAY,
  'warm-orange': {
    id: 'warm-orange',
    name: '暖心橘',
    description: '温暖活力的橘色系',
    colors: {
      primary: '#c86442',
      link: '#c86442',
      quoteBorder: '#c86442',
      codeBg: '#f8f5f3',
      codeFg: '#24292f',
      codeBlockHeader: '#efebe8',
    },
    fontSize: {
      h1: 20,
      h2: 18,
      h3: 16,
      body: 15,
    },
    lineHeight: 1.8,
  },
  'elegant-red': {
    id: 'elegant-red',
    name: '优雅红',
    description: '典雅大气的红色系，适合正式场合',
    colors: {
      primary: '#a63f3f',
      link: '#a63f3f',
      quoteBorder: '#a63f3f',
      codeBg: '#fdf6f6',
      codeFg: '#24292f',
      codeBlockHeader: '#f5e9e9',
    },
    fontSize: {
      h1: 20,
      h2: 18,
      h3: 16,
      body: 15,
    },
    lineHeight: 1.8,
  },
};

/**
 * 获取主题
 */
export function getTheme(themeId: string): WeChatTheme {
  return THEMES[themeId] || TECH_BLUE;
}

/**
 * 获取所有主题列表
 */
export function getAllThemes(): WeChatTheme[] {
  return Object.values(THEMES);
}
