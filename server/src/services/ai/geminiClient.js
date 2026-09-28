import { ai, isGeminiConfigured } from '../../config/gemini.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const TIMEOUT_MS = 15000;

/**
 * Execute a promise with a specified timeout in milliseconds.
 */
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
    ),
  ]);
};

export const geminiClient = {
  /**
   * Generates a JSON response from Gemini with timeout and 1 retry.
   *
   * @param {Object} options
   * @param {string} options.system - System instructions
   * @param {string} options.prompt - User prompt text
   * @param {Object} [options.schema] - Optional JSON schema for structured output
   * @returns {Promise<any>} Parsed JSON result
   */
  generateJson: async ({ system, prompt, schema }) => {
    if (!isGeminiConfigured || !ai) {
      throw new Error('Gemini API is not configured');
    }

    const config = {
      responseMimeType: 'application/json',
    };
    if (system) {
      config.systemInstruction = system;
    }
    if (schema) {
      config.responseSchema = schema;
    }

    let lastError = null;

    // Up to 2 attempts (1 initial + 1 retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: env.GEMINI_MODEL,
            contents: prompt,
            config,
          }),
          TIMEOUT_MS
        );

        const rawText = response.text?.trim() || '';
        // In case response is wrapped in markdown code blocks: ```json ... ```
        const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
        return JSON.parse(cleanedText);
      } catch (err) {
        lastError = err;
        logger.warn(`Gemini generateJson attempt ${attempt} failed: ${err.message}`);
        if (attempt === 1) {
          // Brief backoff before retry
          await new Promise((res) => setTimeout(res, 500));
        }
      }
    }

    throw lastError || new Error('Gemini generateJson failed after retry');
  },
};
