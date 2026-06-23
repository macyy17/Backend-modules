import type { ModuleHandlerResult, ModuleRequest } from '../../../server/src/types.js';
import { TranslatorService } from '../services/TranslatorService.js';
import type { TranslateRequest } from '../types/TranslatorTypes.js';

function string_value(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function parse_translate_request(request: ModuleRequest): TranslateRequest {
  const source = request.method.toUpperCase() === 'GET'
    ? request.query
    : request.body && typeof request.body === 'object' && !Array.isArray(request.body)
      ? request.body as Record<string, unknown>
      : {};

  const text = string_value(source, 'text').trim();
  const from = string_value(source, 'from').trim() || 'auto';
  const to = string_value(source, 'to').trim();

  if (!text) throw new Error('Text is required.');
  if (!to) throw new Error('Target language is required.');

  return { text, from, to };
}

export class TranslatorController {
  constructor(private readonly translator_service: TranslatorService) {}

  async translate(request: ModuleRequest): Promise<ModuleHandlerResult> {
    let payload: TranslateRequest;

    try {
      payload = parse_translate_request(request);
    } catch (error) {
      return {
        status: 422,
        body: {
          error: {
            code: 'VALIDATION_FAILED',
            message: error instanceof Error ? error.message : 'Invalid request.',
            details: {
              fields: ['text', 'from', 'to'],
            },
          },
        },
      };
    }

    try {
      const response = await this.translator_service.translate(payload);
      return {
        status: 200,
        body: response,
      };
    } catch (error) {
      return {
        status: 503,
        body: {
          error: {
            code: 'TRANSLATION_PROVIDER_FAILED',
            message: error instanceof Error ? error.message : 'Translation provider failed.',
            details: {},
          },
        },
      };
    }
  }
}
