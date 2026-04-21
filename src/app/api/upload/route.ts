import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format");
  }

  const contentType = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");

  return { contentType, buffer };
}

function getExtensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "png";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageDataUrl = body?.imageDataUrl as string | undefined;

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    const { contentType, buffer } = parseDataUrl(imageDataUrl);
    const extension = getExtensionFromContentType(contentType);
    const fileName = `person_${Date.now()}_${Math.random().toString(36).slice(2, 11)}.${extension}`;

    const url = await uploadToR2(buffer, fileName, contentType);

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[Upload API] 上传失败:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
