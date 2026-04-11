# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian2MP is an Obsidian plugin that pushes notes to WeChat Official Account (微信公众号) with optional Markdown beautification before publishing.

## Build & Development

```bash
# Install dependencies
npm install

# Development mode with watch
npm run dev

# Production build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck
```

## Architecture

```
src/
├── main.ts        # Plugin entry point, commands, ribbon icon
├── settings.ts    # Settings interface and settings tab UI
```

## Key Features

1. **Push to WeChat MP**: Converts Markdown to WeChat-compatible HTML and copies to clipboard
2. **Beautify Markdown**: Hooks for calling AI skills (e.g., Claude API) to beautify content before push
3. **Direct API Push** (TODO): Optional direct publishing via WeChat MP API with configured credentials

## WeChat MP Integration

- Current implementation copies styled HTML to clipboard for manual paste
- Future: Direct draft creation via `https://api.weixin.qq.com/cgi-bin/draft/add`
- Requires `access_token` obtained from AppID + AppSecret

## Extension Points

- `callBeautifySkill()`: Implement AI service integration for content beautification
- `markdownToWeChatHTML()`: Enhance markdown parser for better WeChat styling
- Add material library management, image upload handling
