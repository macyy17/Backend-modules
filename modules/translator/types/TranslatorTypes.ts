export type TranslateRequest = {
  text: string;
  from: string;
  to: string;
};

export type TranslateResponse = {
  translatedText: string;
  from: string;
  to: string;
  provider: 'groq';
  model: string;
};

export type GroqToolTranslation = {
  translated_text: string;
  detected_from: string;
  to: string;
};
