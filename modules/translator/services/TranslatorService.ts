import type { TranslateRequest, TranslateResponse } from '../types/TranslatorTypes.js';

type GroqToolArguments = {
  translated_text: string;
  detected_from: string;
  to: string;
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TOOL_NAME = 'return_translation';

function get_groq_api_key(): string {
  const key = process.env.GROQ_API_KEY?.trim();

  if (!key) {
    throw new Error('GROQ_API_KEY is missing.');
  }

  if (!key.startsWith('gsk_')) {
    throw new Error('GROQ_API_KEY is invalid.');
  }

  return key;
}

function parse_tool_arguments(value: unknown): GroqToolArguments {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Groq did not return tool arguments.');
  }

  const parsed = JSON.parse(value) as Partial<GroqToolArguments>;

  if (typeof parsed.translated_text !== 'string') {
    throw new Error('Groq tool response is missing translated_text.');
  }

  return {
    translated_text: parsed.translated_text,
    detected_from: typeof parsed.detected_from === 'string' ? parsed.detected_from : 'auto',
    to: typeof parsed.to === 'string' ? parsed.to : 'unknown'
  };
}

export class TranslatorService {
  async translate(payload: TranslateRequest): Promise<TranslateResponse> {
    const api_key = get_groq_api_key();

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${api_key}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: [
              'You are a translation engine.',
              'Translate faithfully.',
              'Preserve meaning, tone, names, numbers, and formatting where possible.',
              'If source language is auto, detect it.',
              'You must call the provided tool with the final translation.'
            ].join(' ')
          },
          {
            role: 'user',
            content: [
              `Text: ${payload.text}`,
              `Source language: ${payload.from}`,
              `Target language: ${payload.to}`
            ].join('\n')
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: TOOL_NAME,
              description: 'Return the completed translation.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  translated_text: {
                    type: 'string',
                    description: 'The translated text.'
                  },
                  detected_from: {
                    type: 'string',
                    description: 'The detected or specified source language.'
                  },
                  to: {
                    type: 'string',
                    description: 'The target language.'
                  }
                },
                required: ['translated_text', 'detected_from', 'to']
              }
            }
          }
        ],
        tool_choice: {
          type: 'function',
          function: {
            name: TOOL_NAME
          }
        }
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'error' in data
          ? JSON.stringify((data as { error: unknown }).error)
          : `Groq request failed with HTTP ${response.status}.`;

      throw new Error(message);
    }

    const tool_arguments = (
      data as {
        choices?: Array<{
          message?: {
            tool_calls?: Array<{
              function?: {
                arguments?: unknown;
              };
            }>;
          };
        }>;
      }
    )?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;

    const result = parse_tool_arguments(tool_arguments);

    return {
      translatedText: result.translated_text,
      from: result.detected_from || payload.from,
      to: result.to || payload.to
    };
  }
}
