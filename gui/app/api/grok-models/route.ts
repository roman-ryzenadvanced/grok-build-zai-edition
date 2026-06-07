import { NextResponse } from "next/server";
import { parseModels, getDefaultModel } from "@/lib/config-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = parseModels();
    const defaultModel = getDefaultModel();
    return NextResponse.json({ models, defaultModel });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse models", message: (error as Error).message },
      { status: 500 }
    );
  }
}
