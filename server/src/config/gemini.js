import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let ai = null;

if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
  try {
    ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    logger.info(`Gemini AI client initialized (model: ${env.GEMINI_MODEL})`);
  } catch (err) {
    logger.warn(`Failed to initialize Gemini AI client: ${err.message}`);
    ai = null;
  }
} else {
  logger.info('No GEMINI_API_KEY configured; AI features will use deterministic heuristics.');
}

export const isGeminiConfigured = Boolean(ai);
export { ai };
