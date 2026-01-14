import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export const rosterExtractionSchema = z.object({
  bowlers: z.array(z.object({
    name: z.string(),
    startingAverage: z.number().min(0).max(300),
    confidence: z.enum(["high", "medium", "low"]),
  })),
  teamName: z.string().optional(),
});

export const scoreExtractionSchema = z.object({
  scores: z.array(z.object({
    bowlerName: z.string(),
    game1: z.number().min(0).max(300).optional(),
    game2: z.number().min(0).max(300).optional(),
    game3: z.number().min(0).max(300).optional(),
    confidence: z.enum(["high", "medium", "low"]),
  })),
});

export type RosterExtraction = z.infer<typeof rosterExtractionSchema>;
export type ScoreExtraction = z.infer<typeof scoreExtractionSchema>;

export async function extractRosterFromImage(base64Image: string): Promise<RosterExtraction> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at extracting bowling roster data from images. 
Extract bowler names and their starting averages from the image.
Return a JSON object with this exact structure:
{
  "teamName": "optional team name if visible",
  "bowlers": [
    { "name": "Bowler Name", "startingAverage": 180, "confidence": "high" }
  ]
}

Confidence levels:
- "high": Text is clearly readable
- "medium": Text is somewhat unclear but best guess is provided  
- "low": Text is hard to read, this is an uncertain guess

If you cannot read a value, use your best guess and mark confidence as "low".
Average scores should be between 0-300. If no average is visible, estimate based on context or use 150 as default.
Always return valid JSON.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all bowler names and their starting averages from this bowling roster or team sheet image."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  
  return rosterExtractionSchema.parse({
    bowlers: parsed.bowlers || [],
    teamName: parsed.teamName,
  });
}

export async function extractScoresFromImage(base64Image: string, bowlerNames?: string[]): Promise<ScoreExtraction> {
  const bowlerContext = bowlerNames?.length 
    ? `Known bowlers to match: ${bowlerNames.join(", ")}. Try to match extracted names to these known bowlers.`
    : "";

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at extracting bowling scores from score sheet images.
Extract each bowler's name and their game scores (up to 3 games).
${bowlerContext}

Return a JSON object with this exact structure:
{
  "scores": [
    { "bowlerName": "Bowler Name", "game1": 180, "game2": 195, "game3": 210, "confidence": "high" }
  ]
}

Confidence levels:
- "high": Scores are clearly readable
- "medium": Scores are somewhat unclear but best guess is provided
- "low": Scores are hard to read, this is an uncertain guess

If a game score is not visible or not played, omit that game field.
All scores should be between 0-300.
Always return valid JSON.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all bowler names and their game scores from this bowling score sheet image."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  
  return scoreExtractionSchema.parse({
    scores: parsed.scores || [],
  });
}
