import { z } from 'zod';
import { geminiClient } from './geminiClient.js';
import { isGeminiConfigured } from '../../config/gemini.js';
import { logger } from '../../utils/logger.js';

export const SYSTEM_MATCH_PROMPT =
  'You match lost-and-found reports at a university. Compare the source item against each candidate. ' +
  'Score 0–100 for the likelihood they are the same physical object. Consider object type, brand, color, ' +
  'distinguishing marks, location proximity and date. Be conservative: different colors/brands/categories ' +
  'score below 40. Do not invent details. Reply with JSON only.';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
  'the', 'to', 'was', 'were', 'will', 'with', 'my', 'i', 'left',
  'lost', 'found', 'near', 'campus', 'item', 'please', 'help',
]);

const tokenize = (text = '') => {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
};

const aiMatchResponseSchema = z.object({
  matches: z
    .array(
      z.object({
        candidateId: z.string(),
        matchScore: z.coerce.number().min(0).max(100),
        reasoning: z.string().default(''),
        matchingAttributes: z.array(z.string()).default([]),
      })
    )
    .default([]),
});

export const matchScorer = {
  /**
   * Calculates a deterministic heuristic match score between 0 and 100.
   *
   * @param {Object} source
   * @param {Object} candidate
   * @returns {{ score: number, matchingAttributes: string[], reasoning: string }}
   */
  scoreHeuristic: (source, candidate) => {
    let score = 0;
    const matchingAttributes = [];

    // 1. Category matching (+30 or +10 for OTHER)
    if (source.category === candidate.category) {
      score += 30;
      matchingAttributes.push(`Same category (${source.category})`);
    } else if (source.category === 'OTHER' || candidate.category === 'OTHER') {
      score += 10;
      matchingAttributes.push('General category overlap');
    }

    // 2. Location token overlap (up to +25)
    const sourceLocTokens = tokenize(source.location || '');
    const candLocTokens = new Set(tokenize(candidate.location || ''));
    const commonLoc = sourceLocTokens.filter((t) => candLocTokens.has(t));
    if (commonLoc.length >= 2) {
      score += 25;
      matchingAttributes.push(`Shared location details (${commonLoc.slice(0, 2).join(', ')})`);
    } else if (commonLoc.length === 1) {
      score += 15;
      matchingAttributes.push(`Nearby location (${commonLoc[0]})`);
    }

    // 3. Date proximity (0 days = 15, 7+ days = 0, linear up to +15)
    const sourceDate = new Date(source.date).getTime();
    const candDate = new Date(candidate.date).getTime();
    const diffDays = Math.abs(sourceDate - candDate) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) {
      const dateScore = Math.max(0, 15 * (1 - diffDays / 7));
      score += dateScore;
      if (diffDays <= 2) {
        matchingAttributes.push(`Close date proximity (within ${Math.ceil(diffDays)} day${diffDays <= 1 ? '' : 's'})`);
      }
    }

    // 4. Jaccard similarity of title + description tokens (up to +30)
    const sourceTokens = new Set([
      ...tokenize(source.title),
      ...tokenize(source.description),
    ]);
    const candTokens = new Set([
      ...tokenize(candidate.title),
      ...tokenize(candidate.description),
    ]);

    if (sourceTokens.size > 0 && candTokens.size > 0) {
      let intersectionCount = 0;
      sourceTokens.forEach((token) => {
        if (candTokens.has(token)) {
          intersectionCount++;
        }
      });
      const unionCount = sourceTokens.size + candTokens.size - intersectionCount;
      const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;
      const textScore = Math.min(30, Math.round(jaccard * 30 * 2)); // scaling factor for short campus descriptions
      score += textScore;

      if (intersectionCount > 0) {
        matchingAttributes.push('Matching keywords in title and description');
      }
    }

    const finalScore = Math.min(100, Math.round(score));
    const reasoning = `Heuristic match calculated with ${matchingAttributes.length} matching criteria.`;

    return {
      score: finalScore,
      matchingAttributes,
      reasoning,
    };
  },

  /**
   * Scores a source item against a list of candidates using Gemini AI,
   * falling back to the heuristic scorer if Gemini is unavailable or errors.
   *
   * @param {Object} source
   * @param {Array<Object>} candidates
   * @returns {Promise<Array<{ candidateId: string, score: number, reasoning: string, matchingAttributes: string[], source: 'GEMINI'|'HEURISTIC' }>>}
   */
  scoreCandidates: async (source, candidates) => {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const candidateMap = new Map(candidates.map((c) => [c._id?.toString() || c.id?.toString(), c]));

    // Check if Gemini is enabled and configured
    if (isGeminiConfigured) {
      try {
        // Strip sensitive user data; send only item properties
        const cleanSource = {
          id: source._id?.toString() || source.id?.toString(),
          type: source.type,
          title: source.title,
          category: source.category,
          description: source.description,
          location: source.location,
          date: source.date,
        };

        const cleanCandidates = candidates.map((c) => ({
          id: c._id?.toString() || c.id?.toString(),
          type: c.type,
          title: c.title,
          category: c.category,
          description: c.description,
          location: c.location,
          date: c.date,
        }));

        const prompt = `SOURCE ITEM:\n${JSON.stringify(cleanSource, null, 2)}\n\nCANDIDATE ITEMS:\n${JSON.stringify(cleanCandidates, null, 2)}`;

        const responseSchema = {
          type: 'object',
          properties: {
            matches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  candidateId: { type: 'string' },
                  matchScore: { type: 'integer' },
                  reasoning: { type: 'string' },
                  matchingAttributes: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
                required: ['candidateId', 'matchScore', 'reasoning'],
              },
            },
          },
          required: ['matches'],
        };

        const resultJson = await geminiClient.generateJson({
          system: SYSTEM_MATCH_PROMPT,
          prompt,
          schema: responseSchema,
        });

        const parsed = aiMatchResponseSchema.safeParse(resultJson);
        if (parsed.success && Array.isArray(parsed.data.matches)) {
          const results = [];
          for (const m of parsed.data.matches) {
            // Only accept valid candidate IDs that were sent
            if (candidateMap.has(m.candidateId)) {
              results.push({
                candidateId: m.candidateId,
                score: Math.min(100, Math.max(0, Math.round(m.matchScore))),
                reasoning: m.reasoning || '',
                matchingAttributes: m.matchingAttributes || [],
                source: 'GEMINI',
              });
            }
          }
          if (results.length > 0) {
            return results;
          }
        }
      } catch (err) {
        logger.warn(`AI candidate scoring failed, falling back to heuristic: ${err.message}`);
      }
    }

    // Heuristic fallback for all candidates
    return candidates.map((cand) => {
      const candId = cand._id?.toString() || cand.id?.toString();
      const h = matchScorer.scoreHeuristic(source, cand);
      return {
        candidateId: candId,
        score: h.score,
        reasoning: h.reasoning,
        matchingAttributes: h.matchingAttributes,
        source: 'HEURISTIC',
      };
    });
  },
};
