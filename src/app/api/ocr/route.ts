import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSpreadsheet } from "@/lib/ocr/spreadsheet-parser";
import { analyzeWithGemini } from "@/lib/ocr/gemini";
import { analyzeWithClaude } from "@/lib/ocr/claude-vision";

const SPREADSHEET_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "text/csv",
  "application/csv",
];

const SPREADSHEET_EXTS = [".xlsx", ".xls", ".csv", ".tsv"];

function isSpreadsheet(file: File): boolean {
  if (SPREADSHEET_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return SPREADSHEET_EXTS.some((ext) => name.endsWith(ext));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null; // keep "image" key for backward compat
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "未提供檔案" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "未指定資產類別" },
        { status: 400 }
      );
    }

    let holdings;

    if (isSpreadsheet(file)) {
      // --- Spreadsheet parsing (no API needed) ---
      const arrayBuffer = await file.arrayBuffer();
      holdings = parseSpreadsheet(arrayBuffer, file.name);
    } else if (file.type.startsWith("image/")) {
      // --- Image OCR (requires API) ---
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "image/png";

      let ocrEngine = "gemini";
      try {
        const setting = await prisma.settings.findUnique({
          where: { key: "ocrEngine" },
        });
        if (setting?.value) {
          ocrEngine = setting.value;
        }
      } catch {
        // Default to gemini
      }

      if (ocrEngine === "claude") {
        holdings = await analyzeWithClaude(base64, mimeType, category);
      } else {
        holdings = await analyzeWithGemini(base64, mimeType, category);
      }
    } else {
      return NextResponse.json(
        { error: "不支援的檔案格式。請上傳 Excel (.xlsx)、CSV 或圖片檔" },
        { status: 400 }
      );
    }

    // Save upload record
    try {
      await prisma.ocrUpload.create({
        data: {
          category,
          imageName: file.name || "upload",
          rawOcrText: JSON.stringify(holdings),
          parsedData: JSON.stringify(holdings),
          status: "completed",
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ holdings });
  } catch (error) {
    console.error("Parse error:", error);
    const message =
      error instanceof Error ? error.message : "檔案解析失敗";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
