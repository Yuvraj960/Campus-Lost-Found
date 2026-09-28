# AI matching & assistant

## Module layout (`server/src/`)
`config/gemini.js` (client init, null if no key) · `services/ai/geminiClient.js` (`generateJson({ system, prompt, schema })` with timeout 15s, 1 retry) · `services/ai/matchScorer.js` (AI + heuristic) · `services/matchingService.js` (orchestration) · `services/ai/assistService.js`. Model name = `process.env.GEMINI_MODEL`. Keys never leave the server.

## Trigger
After `POST /items` responds (and on `POST /items/:id/rematch`): `matchingService.runForItem(itemId)`.
Symmetric: a new LOST item is compared with ACTIVE FOUND items; a new FOUND item with ACTIVE LOST items.

## Candidate selection (cheap prefilter, Mongo query)
- opposite `type`, `status=ACTIVE`, `isRemoved=false`, different `owner`.
- `category` equal, or either is `OTHER`.
- Date window: found date must be ≥ lost date − 1 day and ≤ lost date + 30 days.
- Rank by heuristic score (below); keep top 5 with heuristic ≥ 25.

## Heuristic score (0–100) — also the fallback when no AI key
category same +30 (OTHER involved +10) · location token overlap up to +25 · date proximity up to +15 (0 days = 15, 7+ days = 0, linear) · Jaccard similarity of tokens from title+description (lowercased, stop-words removed) up to +30. Fallback threshold `FALLBACK_MATCH_THRESHOLD` (60).

## AI scoring (one request per new item, all candidates batched)
Send only item fields: `id, type, title, category, description, location, date`. Never send names, emails, phones or ids of users.

System prompt (store as constant):
> You match lost-and-found reports at a university. Compare the source item against each candidate. Score 0–100 for the likelihood they are the same physical object. Consider object type, brand, color, distinguishing marks, location proximity and date. Be conservative: different colors/brands/categories score below 40. Do not invent details. Reply with JSON only.

Response schema (use Gemini `responseMimeType: "application/json"` + `responseSchema`; also validate with Zod, clamp scores 0–100, drop unknown ids):
```json
{ "matches": [ { "candidateId": "string", "matchScore": 91, "reasoning": "one or two sentences", "matchingAttributes": ["same location", "same color"] } ] }
```

## Persistence & notification
- Create `Match` when `matchScore >= MATCH_THRESHOLD` (75; fallback 60), `source` = `GEMINI` or `HEURISTIC`. Upsert on `{lostItem, foundItem}` so reruns don't duplicate.
- Notify **both** owners (`MATCH_FOUND`, link `/items/:id` of their own item, message "Possible match found for “<title>”").
- Log counts (candidates, matches, source, ms) with `logger`. Any failure → log and return; never throw to callers.

## UI contract (`MatchCard`)
Score badge (e.g. "91% match"), reasoning text, checklist from `matchingAttributes` (✓ Same location …), buttons **View item** and **Not a match** (PATCH dismiss). Show on ItemDetails (owner only) and Dashboard "Possible matches" section.

## Assistant (`POST /ai/assist`)
Prompt: turn a messy description into `{ suggestedTitle, category (enum), keywords[≤8], likelyLocations[≤3], clarifyingQuestions[≤3] }`. Constrain category to enum values in the schema. Fallback: keyword→category dictionary. UI: "Help me describe it" button on the Report form; suggestions are **applied only when the user clicks**.

## Testing
Mock `geminiClient` in tests. Cases: prefilter excludes same owner/inactive/wrong category; threshold respected; duplicate rerun doesn't duplicate; AI failure falls back to heuristic; malformed AI JSON is handled; item creation succeeds even if matching throws.
