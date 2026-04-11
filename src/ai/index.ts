/**
 * AI Module Entry Point
 */

export { AIService, createAIService } from './service';
export type {
  AIServiceConfig,
  BeautifyOptions,
  BeautifyResult,
  TitleSuggestion,
} from './service';

export {
  PROMPT_TEMPLATES,
  getPromptTemplate,
  getAllPromptTemplates,
  renderPrompt,
  usePrompt,
} from './prompts';
export type { PromptTemplate } from './prompts';
