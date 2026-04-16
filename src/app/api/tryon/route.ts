import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
const API_KEY = process.env.ARK_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[API Route] 收到试衣请求", {
      hasPersonImage: !!body.personImageUrl,
      hasClothingImage: !!body.clothingImageUrl,
      category: body.category,
    });

    if (!API_KEY) {
      return NextResponse.json(
        { error: { code: "ConfigurationError", message: "API key not configured" } },
        { status: 500 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || "doubao-seedream-5-0-260128",
        prompt: body.prompt,
        image: body.image,
        sequential_image_generation: "disabled",
        response_format: "url",
        size: "2K",
        stream: false,
        watermark: true,
      }),
    });

    console.log("[API Route] API响应状态", {
      status: response.status,
      statusText: response.statusText,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[API Route] API错误响应", data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log("[API Route] API成功响应", {
      hasUrl: !!data.data?.[0]?.url,
      size: data.data?.[0]?.size,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Route] 代理请求失败", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: { code: "ProxyError", message: "Failed to proxy request" } },
      { status: 500 }
    );
  }
}
