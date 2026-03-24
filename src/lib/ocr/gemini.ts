import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedHoldingResult {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number | null;
}

const OCR_PROMPT = `Extract stock/crypto holdings from this broker screenshot. Return a JSON array where each element has:
- "symbol": the stock ticker or crypto symbol (string)
- "name": the full name of the asset (string)
- "quantity": number of shares/units held (number)
- "costBasis": total cost basis if visible, otherwise null (number or null)

Return ONLY valid JSON. No markdown, no explanation, just the JSON array.`;

export async function analyzeWithGemini(
  base64Image: string,
  mimeType: string,
  category: string
): Promise<ParsedHoldingResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const categoryHint =
    category === "tw_stock"
      ? " This is a Taiwan stock broker screenshot. Symbols are numeric (e.g. 2330)."
      : category === "us_stock"
        ? " This is a US stock broker screenshot. Symbols are alphabetic (e.g. AAPL)."
        : " This is a crypto exchange screenshot. Symbols are crypto tickers (e.g. BTC).";

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
    OCR_PROMPT + categoryHint,
  ]);

  const responseText = result.response.text();

  // Extract JSON from response (handle potential markdown code blocks)
  let jsonStr = responseText.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Find the array in the response
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    throw new Error("Could not parse OCR response as JSON array");
  }

  const parsed = JSON.parse(arrayMatch[0]);

  if (!Array.isArray(parsed)) {
    throw new Error("OCR response is not an array");
  }

  return parsed.map(
    (item: {
      symbol?: string;
      name?: string;
      quantity?: number;
      costBasis?: number | null;
    }) => ({
      symbol: String(item.symbol ?? ""),
      name: String(item.name ?? ""),
      quantity: Number(item.quantity) || 0,
      costBasis: item.costBasis != null ? Number(item.costBasis) : null,
    })
  );
}
