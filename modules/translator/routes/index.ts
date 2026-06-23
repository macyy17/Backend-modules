import type { ModuleRegisterContext } from '../../../server/src/types.js';
import { TranslatorController } from '../controllers/TranslatorController.js';
import { TranslatorService } from '../services/TranslatorService.js';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  const translator_service = new TranslatorService();
  const translator_controller = new TranslatorController(translator_service);
  const translate = translator_controller.translate.bind(translator_controller);

  context.addRoute('GET', '/translate', translate, {
    description: 'Translate text using query fields: text, from, to.',
  });

  context.addRoute('POST', '/translate', translate, {
    description: 'Translate text using JSON body fields: text, from, to.',
  });
}
