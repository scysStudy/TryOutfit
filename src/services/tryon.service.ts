import { API_CONFIG } from "@/lib/api-config";
import type { ApiError, TryOnApiResponse, TryOnRequest, ClothingCategory } from "@/types";

function getCategoryPrompt(category: ClothingCategory): string {
  switch (category) {
    case "tops":
      return "Replace the clothing in image 1 with the clothing shown in image 2. Keep the person's face, body shape, and pose unchanged.";
    case "bottoms":
      return "Replace the lower body clothing in image 1 with the clothing shown in image 2. Keep the person's face, body shape, and pose unchanged.";
    case "dresses":
      return "Replace the clothing in image 1 with the dress shown in image 2. Keep the person's face, body shape, and pose unchanged.";
    default:
      return "Replace the clothing in image 1 with the clothing shown in image 2.";
  }
}

function parseApiError(response: Response, data: unknown): ApiError {
  const errorData = data as { code?: string; message?: string; error?: { code?: string; message?: string } };

  if (response.status === 401 || response.status === 403) {
    return {
      code: "AuthenticationError",
      message: "API key is invalid or missing. Please check your configuration.",
      type: "AuthenticationError",
      statusCode: response.status,
    };
  }

  if (response.status === 429) {
    return {
      code: "RateLimitError",
      message: "Too many requests. Please wait a moment and try again.",
      type: "RateLimitError",
      statusCode: response.status,
    };
  }

  if (response.status >= 500) {
    return {
      code: "ServerError",
      message: "Server error. Please try again later.",
      type: "ServerError",
      statusCode: response.status,
    };
  }

  return {
    code: errorData?.code || errorData?.error?.code || "UnknownError",
    message: errorData?.message || errorData?.error?.message || "An unknown error occurred",
    type: "UnknownError",
    statusCode: response.status,
  };
}

export async function generateTryOnImage(
  request: TryOnRequest
): Promise<TryOnApiResponse> {
  const { personImageUrl, clothingImageUrl, category } = request;

  console.log("[TryOn] 开始生成试衣图", {
    personImageUrl,
    clothingImageUrl,
    category,
    timestamp: new Date().toISOString(),
  });

  const prompt = getCategoryPrompt(category);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch("/api/tryon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        image: [personImageUrl, clothingImageUrl],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("[TryOn] API响应状态", {
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString(),
    });

    const data = await response.json();

    console.log("[TryOn] API响应数据", JSON.stringify(data, null, 2));

    if (!response.ok) {
      const error = parseApiError(response, data);
      console.error("[TryOn] API错误", {
        errorCode: error.code,
        errorMessage: error.message,
        statusCode: error.statusCode,
      });
      throw error;
    }

    const resultData = data as {
      data?: Array<{ url?: string; size?: string }>;
      created?: number;
      usage?: { generated_images?: number; output_tokens?: number; total_tokens?: number };
    };

    if (!resultData.data || resultData.data.length === 0 || !resultData.data[0].url) {
      console.error("[TryOn] 响应数据格式错误", data);
      throw {
        code: "InvalidResponse",
        message: "Invalid response from API",
        type: "UnknownError" as const,
      };
    }

    const result: TryOnApiResponse = {
      url: resultData.data[0].url,
      size: resultData.data[0].size || "unknown",
    };

    console.log("[TryOn] 生成成功", {
      resultUrl: result.url,
      size: result.size,
      created: resultData.created,
      usage: resultData.usage,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    console.error("[TryOn] 捕获到错误", {
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : undefined,
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("[TryOn] 网络错误 - 可能为CORS或网络问题", error);
      throw {
        code: "NetworkError",
        message: "Network error. Please check your connection and try again.",
        type: "UnknownError" as const,
      } as ApiError;
    }

    if (error instanceof Error && error.name === "AbortError") {
      console.error("[TryOn] 请求超时", {
        timeout: API_CONFIG.timeout,
        timestamp: new Date().toISOString(),
      });
      throw {
        code: "TimeoutError",
        message: "Request timed out. Please check your network and try again.",
        type: "TimeoutError" as const,
      } as ApiError;
    }

    if ((error as ApiError).type) {
      throw error;
    }

    console.error("[TryOn] 未知错误", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    throw {
      code: "UnknownError",
      message: error instanceof Error ? error.message : "An unknown error occurred",
      type: "UnknownError" as const,
    } as ApiError;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as ApiError).type === "string"
  );
}

export function shouldDeductCredit(error: ApiError): boolean {
  return error.type !== "AuthenticationError" &&
    error.type !== "RateLimitError" &&
    error.type !== "TimeoutError";
}
