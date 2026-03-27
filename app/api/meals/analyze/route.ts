import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";

export const runtime = "nodejs";

const systemPrompt = `You are a precision nutrition chef and recipe parser.
Return ONLY valid JSON. No prose, no markdown, no commentary.
All macro values must be consistent: protein×4 + carbs×4 + fat×9 ˜ calories (±15).
If the photo is ambiguous, make a best-effort estimate without stating uncertainty.`;

const userPrompt = `Analyze the meal photo and return a SINGLE JSON object with this exact structure:

{
  "name": "",
  "description": "",
  "emoji": "",
  "category": "breakfast|protein|veggie|carbs|light|snack",
  "colorTheme": "amber|coral|green|teal|blue",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "fibre": 0,
  "satiating": 1,
  "prepMinutes": 0,
  "cookMinutes": 0,
  "difficulty": 1,
  "tags": ["budget","high protein","quick","meal prep","pre-workout","breakfast","vegetarian","vegan","gluten-free","dairy-free"],
  "ingredients": [
    { "name": "", "amount": "", "category": "" }
  ],
  "steps": [""],
  "tools": [""],
  "allergens": ["gluten","dairy","nuts","peanuts","soy","eggs","fish","shellfish","sesame"],
  "isVegetarian": false,
  "isVegan": false,
  "isGlutenFree": false,
  "isDairyFree": false,
  "isHalal": false,
  "isKosher": false,
  "isNutFree": false
}

Rules:
- Keep description = 80 characters.
- Difficulty must be 1, 2, or 3.
- Include 4–8 ingredients with realistic amounts.
- Include 3–6 steps.
- Tags should be a small, relevant subset.
- If unsure about a tag or flag, leave it false or omit the tag.
- Ensure macro calories are within ±15 of the stated calories.
Return ONLY the JSON object.`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  }

  if (!process.env.MEAL_PHOTO_AI_ENABLED) {
    return NextResponse.json(
      {
        error: "AI photo analysis is not configured.",
        prompt: { system: systemPrompt, user: userPrompt },
      },
      { status: 501 },
    );
  }

  // TODO: Wire to a vision-capable model (OpenAI/Anthropic/etc.)
  // Use systemPrompt + userPrompt with the attached image.
  return NextResponse.json(
    {
      error: "AI photo analysis is not configured.",
      prompt: { system: systemPrompt, user: userPrompt },
    },
    { status: 501 },
  );
}
