import { z } from 'zod';
import { geminiClient } from './geminiClient.js';
import { isGeminiConfigured } from '../../config/gemini.js';
import { CATEGORY } from '../../constants/enums.js';
import { logger } from '../../utils/logger.js';

export const SYSTEM_ASSIST_PROMPT =
  'You assist university students reporting lost or found items. Given a brief or messy description of an item, ' +
  'extract structured details to help them report it accurately. ' +
  `The category MUST be strictly one of: ${Object.values(CATEGORY).join(', ')}. ` +
  'Return maximum 8 keywords, up to 3 plausible campus locations where students might leave or find it, ' +
  'and up to 3 clarifying questions to help verify ownership or identifying marks. Reply with valid JSON only.';

const KEYWORD_CATEGORY_DICT = [
  {
    category: CATEGORY.ELECTRONICS,
    keywords: ['phone', 'iphone', 'samsung', 'android', 'laptop', 'macbook', 'charger', 'cable', 'airpods', 'headphones', 'earphones', 'ipad', 'tablet', 'kindle', 'mouse', 'keyboard'],
  },
  {
    category: CATEGORY.WALLET_BAGS,
    keywords: ['wallet', 'purse', 'backpack', 'bag', 'tote', 'clutch', 'pouch', 'handbag', 'luggage', 'duffel'],
  },
  {
    category: CATEGORY.KEYS,
    keywords: ['key', 'keys', 'keychain', 'fob', 'ring of keys', 'dorm key', 'bike key', 'car key'],
  },
  {
    category: CATEGORY.ID_DOCUMENTS,
    keywords: ['id', 'student card', 'campus card', 'license', 'driver', 'passport', 'id card', 'documents', 'certificate', 'badge'],
  },
  {
    category: CATEGORY.CLOTHING,
    keywords: ['jacket', 'hoodie', 'sweater', 'coat', 'scarf', 'hat', 'cap', 'beanie', 'gloves', 'shoes', 'umbrella', 'shirt'],
  },
  {
    category: CATEGORY.BOOKS_STATIONERY,
    keywords: ['book', 'textbook', 'notebook', 'notes', 'binder', 'pen', 'pencil', 'pencilcase', 'stationery', 'calculator'],
  },
  {
    category: CATEGORY.ACCESSORIES,
    keywords: ['watch', 'smartwatch', 'glasses', 'sunglasses', 'ring', 'necklace', 'bracelet', 'earrings', 'jewelry'],
  },
  {
    category: CATEGORY.SPORTS,
    keywords: ['bottle', 'water bottle', 'flask', 'hydroflask', 'gym', 'ball', 'racket', 'yoga', 'mat', 'jersey', 'cleats'],
  },
];

const assistOutputSchema = z.object({
  suggestedTitle: z.string().trim().min(3).max(100),
  category: z.enum(Object.values(CATEGORY)).default(CATEGORY.OTHER),
  keywords: z.array(z.string()).max(8).default([]),
  likelyLocations: z.array(z.string()).max(3).default([]),
  clarifyingQuestions: z.array(z.string()).max(3).default([]),
});

export const assistService = {
  /**
   * Fallback heuristic parser when Gemini is unavailable.
   */
  getFallbackSuggestions: (text = '') => {
    const lower = text.toLowerCase();

    let matchedCategory = CATEGORY.OTHER;
    for (const entry of KEYWORD_CATEGORY_DICT) {
      if (entry.keywords.some((k) => lower.includes(k))) {
        matchedCategory = entry.category;
        break;
      }
    }

    // Capitalize words for title
    const rawWords = text
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join(' ');
    const titleCandidate = rawWords.length >= 3 ? rawWords : 'Campus Item';
    const suggestedTitle = titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1);

    const words = text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3)
      .slice(0, 6);

    const likelyLocations = ['Main Library', 'Student Center', 'Campus Cafeteria'];
    const clarifyingQuestions = [
      'Are there any identifying marks, serial numbers, or stickers?',
      'What specific color or brand is the item?',
    ];

    return {
      suggestedTitle: suggestedTitle.slice(0, 80),
      category: matchedCategory,
      keywords: words,
      likelyLocations,
      clarifyingQuestions,
    };
  },

  /**
   * Generates AI assist recommendations for a user-provided description.
   *
   * @param {string} text - User's partial or raw description
   * @returns {Promise<Object>}
   */
  suggestFromDescription: async (text) => {
    if (!text || text.trim() === '') {
      return assistService.getFallbackSuggestions(text);
    }

    if (isGeminiConfigured) {
      try {
        const responseSchema = {
          type: 'object',
          properties: {
            suggestedTitle: { type: 'string' },
            category: {
              type: 'string',
              enum: Object.values(CATEGORY),
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
            },
            likelyLocations: {
              type: 'array',
              items: { type: 'string' },
            },
            clarifyingQuestions: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['suggestedTitle', 'category', 'keywords', 'likelyLocations', 'clarifyingQuestions'],
        };

        const resultJson = await geminiClient.generateJson({
          system: SYSTEM_ASSIST_PROMPT,
          prompt: `User description:\n"${text}"`,
          schema: responseSchema,
        });

        const parsed = assistOutputSchema.safeParse(resultJson);
        if (parsed.success) {
          return parsed.data;
        }
      } catch (err) {
        logger.warn(`AI assist generation failed, falling back to heuristic dictionary: ${err.message}`);
      }
    }

    return assistService.getFallbackSuggestions(text);
  },
};
