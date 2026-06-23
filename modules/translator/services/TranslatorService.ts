import { normalize_language_code, normalize_language_name } from '../core/normalizeLanguageCode.js';
import type { GroqToolTranslation, TranslateRequest, TranslateResponse } from '../types/TranslatorTypes.js';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const RETURN_TRANSLATION = 'return_translation';

type GroqToolCall = {
  function?: {
    name?: string;
    arguments?: string;
  };
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: GroqToolCall[];
    };
  }>;
  error?: {
    message?: string;
  };
};

function read_groq_api_key(): string {
  const api_key = process.env.GROQ_API_KEY || '';
  if (!api_key.trim()) {
    throw new Error('GROQ_API_KEY is missing. Add it to server/.env or root .env.');
  }
  return api_key.trim();
}

function parse_tool_arguments(value: string | undefined): GroqToolTranslation | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<GroqToolTranslation>;
    if (typeof parsed.translated_text !== 'string') return null;
    return {
      translated_text: parsed.translated_text,
      detected_from: typeof parsed.detected_from === 'string' ? parsed.detected_from : 'auto',
      to: typeof parsed.to === 'string' ? parsed.to : 'unknown',
    };
  } catch (_error) {
    return null;
  }
}

function build_groq_payload(text: string, from: string, to: string): Record<string, unknown> {
  return {
    model: GROQ_MODEL,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: 'You are a translation engine. Translate faithfully. Preserve meaning, numbers, names, formatting, and tone. Use the required structured function response only.',
      },
      {
        role: 'user',
        content: `Translate this text. Source language: ${from}. Target language: ${to}. Text: ${text}`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: RETURN_TRANSLATION,
          description: 'Return the completed translation using structured fields.',
          parameters: {
            type: 'object',
            additionalProperties: false,
            properties: {
              translated_text: { type: 'string' },
              detected_from: { type: 'string' },
              to: { type: 'string' },
            },
            required: ['translated_text', 'detected_from', 'to'],
          },
        },
      },
    ],
    tool_choice: {
      type: 'function',
      function: {
        name: RETURN_TRANSLATION,
      },
    },
  };
}

export class TranslatorService {
  async translate(payload: TranslateRequest): Promise<TranslateResponse> {
    const text = payload.text.trim();
    const from = normalize_language_code(payload.from);
    const to = normalize_language_name(payload.to);

    const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${read_groq_api_key()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(build_groq_payload(text, from, to)),
    });

    const data = await response.json() as GroqChatResponse;
    if (!response.ok) {
      throw new Error(data.error?.message || `Groq API failed with status ${response.status}.`);
    }

    const message = data.choices?.[0]?.message;
    const selected_call = message?.tool_calls?.find((item) => item.function?.name === RETURN_TRANSLATION);
    const translated = parse_tool_arguments(selected_call?.function?.arguments);

    if (translated) {
      return {
        translatedText: translated.translated_text,
        from: translated.detected_from,
        to: translated.to,
        provider: 'groq',
        model: GROQ_MODEL,
      };
    }

    if (message?.content) {
      return {
        translatedText: message.content.trim(),
        from,
        to,
        provider: 'groq',
        model: GROQ_MODEL,
      };
    }

    throw new Error('Groq API returned no translation.');
  }
}
